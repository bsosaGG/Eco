// Motor determinista de scoring de medios (método deterministic_weighted_rules_v1_2).
//
// Compara cada medio candidato del catálogo contra una recomendación del Brief y
// asigna un puntaje de 0 a 100. No usa IA ni infiere datos inexistentes: el mismo
// input produce siempre el mismo resultado, y cada criterio trae su explicación.
//
// Es una función pura: recibe el catálogo ya cargado (con productos) y no accede
// a la base de datos.
const { ValidationError } = require("../../errors");
const { text, norm, parseNumber, firstNumber, isPlainObject } = require("../text-utils");
const { toFixedHalfEven, roundHalfEven, formatThousands, humanNumber } = require("./numeric");

const METHOD = "deterministic_weighted_rules_v1_2";

const WEIGHTS = {
  profile: 20.0,
  coverage: 25.0,
  audience: 15.0,
  language: 10.0,
  format: 15.0,
  reach: 10.0,
  cost: 5.0,
};

const DEPARTMENTS = [
  "alta verapaz",
  "baja verapaz",
  "chimaltenango",
  "chiquimula",
  "el progreso",
  "escuintla",
  "guatemala",
  "huehuetenango",
  "izabal",
  "jalapa",
  "jutiapa",
  "peten",
  "quetzaltenango",
  "quiche",
  "retalhuleu",
  "sacatepequez",
  "san marcos",
  "santa rosa",
  "solola",
  "suchitepequez",
  "totonicapan",
  "zacapa",
];

const CATEGORY_TO_MEDIA_TYPES = {
  tv: ["tv", "cable"],
  radio: ["radio"],
  digital: ["digital"],
  prensa: ["prensa"],
  exteriores: ["exteriores"],
  alternativos: ["alternativos"],
};

const PROFILE_TAGS = {
  radio_info: ["noticias", "noticioso", "informativo", "coyuntura", "actualidad"],
  radio_music: ["musica", "musical", "entretenimiento"],
  radio_local: ["comunidad", "comunitario", "regional", "agricultura", "servicio"],
};

const FORMAT_GROUPS = {
  tv: [["spot"], ["30", "30 s", "30 segundos"]],
  radio: [["cuna"], ["30", "30 s", "30 segundos"]],
  digital: [["video", "reel"], ["vertical"], ["carrusel"]],
  press: [["pagina completa", "pagina"], ["color", "full color"]],
  regional_press: [["pagina completa", "pagina", "inserto"], ["color", "full color"]],
};

const LOCAL_PROFILE_TOKENS = ["regional", "departamental", "territorial", "multilingue", "inserto"];

function criterion(key, name, score, maximum, explanation) {
  return { key, name, score, maximum, explanation };
}

function criterionAsDict(item) {
  return {
    key: item.key,
    name: item.name,
    score: roundHalfEven(item.score, 2),
    maximum: roundHalfEven(item.maximum, 2),
    explanation: item.explanation,
  };
}

// ---------------------------------------------------------------------------
// Helpers de lectura del catálogo
// ---------------------------------------------------------------------------

const containsAny = (haystack, terms) => terms.some((term) => haystack.includes(term));

function fieldValue(fields, fieldId) {
  if (!isPlainObject(fields)) return "";
  const item = fields[fieldId];
  return isPlainObject(item) ? text(item.value) : text(item);
}

function departmentsIn(value) {
  const normalized = norm(value).replace("alta y baja verapaz", "alta verapaz, baja verapaz");
  return new Set(DEPARTMENTS.filter((department) => normalized.includes(department)));
}

const intersect = (a, b) => new Set([...a].filter((item) => b.has(item)));

function isNational(coverage, regions) {
  return coverage.includes("nacional") || regions.includes("todas las regiones") || regions.includes("todo el pais");
}

function isMultilingual(languages) {
  if (!languages) return false;
  const items = languages
    .replace(/;/g, ",")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const nonSpanish = items.filter((item) => !["espanol", "n/a", "na"].includes(item));
  return items.length >= 2 && nonSpanish.length > 0;
}

function candidateReach(media) {
  const values = [firstNumber(media.reach)];
  for (const product of media.products || []) values.push(parseNumber(product.estimated_audience));
  const positive = values.filter((value) => value !== null && value > 0);
  return positive.length ? Math.max(...positive) : null;
}

function candidateCost(media) {
  const costs = (media.products || []).map((product) => parseNumber(product.unit_cost));
  const positive = costs.filter((value) => value !== null && value > 0);
  if (positive.length) return Math.min(...positive);
  return parseNumber(media.minimum_investment);
}

function candidateCostEfficiency(media, category) {
  const cost = candidateCost(media);
  if (cost === null || cost <= 0) return null;
  // En la hoja Digital el costo unitario ya es una métrica CPM/CPC; dividirlo otra
  // vez por alcance produciría una comparación falsa.
  if (norm(category) === "digital") return cost;
  const reach = candidateReach(media);
  if (reach === null || reach <= 0) return null;
  return (cost / reach) * 1000.0;
}

function derivedFormatTokens(value) {
  // Reconoce orientación geométrica solo cuando el catálogo declara ancho x alto.
  const tokens = new Set();
  for (const match of value.matchAll(/(?<!\d)(\d{2,5})\s*[x×]\s*(\d{2,5})(?!\d)/g)) {
    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);
    if (width <= 0 || height <= 0) continue;
    const ratio = width / height;
    if (ratio <= 0.8) tokens.add("vertical");
    else if (ratio >= 1.25) tokens.add("horizontal");
    else tokens.add("cuadrado");
  }
  return tokens;
}

function productText(media) {
  const parts = [];
  for (const product of media.products || []) {
    parts.push(
      text(product.category),
      text(product.product_name),
      text(product.format),
      text(product.schedule),
      text(product.prime_time)
    );
    if (isPlainObject(product.details)) {
      for (const value of Object.values(product.details)) parts.push(text(value));
    }
  }
  let normalized = norm(parts.join(" "));
  const derived = [...derivedFormatTokens(normalized)].sort();
  if (derived.length) normalized = `${normalized} ${derived.join(" ")}`.trim();
  return normalized;
}

function extractAgeRange(value) {
  const normalized = norm(value);
  if (!normalized) return null;
  let match = normalized.match(/(\d{1,2})\s*(?:-|a|–)\s*(\d{1,2})/);
  if (match) return [parseInt(match[1], 10), parseInt(match[2], 10)];
  match = normalized.match(/(\d{1,2})\s*anos?\s*en\s*adelante/);
  if (match) return [parseInt(match[1], 10), 99];
  match = normalized.match(/mayores?\s+de\s+(\d{1,2})/);
  if (match) return [parseInt(match[1], 10), 99];
  return null;
}

function ageAffinity(targetText, mediumAges) {
  const targetRange = extractAgeRange(targetText);
  const mediaRange = extractAgeRange(mediumAges);
  if (targetRange === null || mediaRange === null) {
    return [0.6, "No hay rangos etarios suficientes para una comparación completa."];
  }
  const [tMin, tMax] = targetRange;
  const [mMin, mMax] = mediaRange;

  // Un objetivo abierto (18+) no exige que el medio cubra literalmente hasta 99
  // años: se evalúa la entrada al rango y la amplitud útil de cobertura adulta.
  if (tMax === 99) {
    let ratio;
    if (mMax < tMin) ratio = 0.0;
    else if (mMin <= tMin) ratio = Math.min(1.0, 0.75 + Math.max(0, mMax - tMin) / 120.0);
    else {
      const gapPenalty = Math.min(0.45, (mMin - tMin) / 40.0);
      ratio = Math.max(0.35, 0.9 - gapPenalty);
    }
    return [
      ratio,
      `Rango del medio ${mMin}-${mMax} frente al objetivo ${tMin}+; compatibilidad aproximada ${toFixedHalfEven(ratio * 100, 0)}%.`,
    ];
  }

  const overlap = Math.max(0, Math.min(tMax, mMax) - Math.max(tMin, mMin) + 1);
  const targetSize = Math.max(1, tMax - tMin + 1);
  const ratio = Math.min(1.0, overlap / targetSize);
  return [
    ratio,
    `Rango del medio ${mMin}-${mMax} frente al objetivo ${tMin}-${tMax}; coincidencia aproximada ${toFixedHalfEven(ratio * 100, 0)}%.`,
  ];
}

function audienceTags(profile, target) {
  if (profile.includes("informativa")) return ["noticias", "coyuntura"];
  if (profile.includes("musical")) return ["musica", "entretenimiento"];
  if (["regional", "territorial", "multilingue"].some((token) => profile.includes(token))) {
    return ["comunidad", "agricultura"];
  }
  if (profile.includes("prensa") || profile.includes("circulacion nacional")) return ["noticias"];
  if (profile.includes("rrss")) return [];
  // Solo un conjunto pequeño de palabras explícitas; sin inferencia semántica.
  return ["noticias", "economia", "comunidad", "agricultura", "entretenimiento"].filter((term) =>
    target.includes(term)
  );
}

function requiresMultilingual(context) {
  const { profile_norm: profile, technical_norm: technical } = context;
  return (
    profile.includes("multilingue") ||
    technical.includes("idiomas locales") ||
    (technical.includes("idioma") && technical.includes("local"))
  );
}

function isLocalProfile(profile) {
  return LOCAL_PROFILE_TOKENS.some((token) => profile.includes(token));
}

// ---------------------------------------------------------------------------
// Criterios
// ---------------------------------------------------------------------------

function scoreProfile(media, context) {
  const maximum = WEIGHTS.profile;
  const profile = context.profile_norm;
  const coverage = norm(media.coverage);
  const regions = norm(media.regions);
  const interests = norm(media.interests);
  const languages = norm(media.languages);
  const products = productText(media);

  let score = 12.0;
  let reasons = ["El tipo de medio coincide con la categoría recomendada."];

  if (profile.includes("radio")) {
    if (profile.includes("territorial") || profile.includes("multilingue")) {
      const local = !isNational(coverage, regions);
      const multilingual = isMultilingual(languages);
      score += local ? 4.0 : 0.0;
      score += multilingual ? 4.0 : 0.0;
      reasons.push(
        local && multilingual
          ? "Combina alcance territorial y oferta multilingüe."
          : "El perfil territorial/multilingüe es solo parcialmente compatible."
      );
    } else if (profile.includes("regional") || profile.includes("departamental")) {
      const local = !isNational(coverage, regions);
      score += local ? 6.0 : 1.0;
      if (containsAny(`${interests} ${products}`, PROFILE_TAGS.radio_local)) score += 2.0;
    } else if (profile.includes("informativa")) {
      const matched = containsAny(`${interests} ${products}`, PROFILE_TAGS.radio_info);
      score += matched ? 4.0 : 0.0;
      reasons.push(
        matched
          ? "Tiene afinidad informativa/noticiosa."
          : "No se observa una afinidad informativa clara en el catálogo."
      );
      if (profile.includes("nacional")) score += isNational(coverage, regions) ? 4.0 : 0.0;
    } else if (profile.includes("musical")) {
      const matched = containsAny(`${interests} ${products}`, PROFILE_TAGS.radio_music);
      score += matched ? 5.0 : 0.0;
      reasons.push(
        matched ? "El perfil del medio es musical/entretenimiento." : "No se identifica claramente un perfil musical."
      );
      if (isNational(coverage, regions) || departmentsIn(media.regions).size >= 7) score += 3.0;
    } else {
      score += 4.0;
      if (profile.includes("nacional") && isNational(coverage, regions)) score += 4.0;
    }
  } else if (context.category_norm === "tv") {
    const mediaType = norm(media.media_type);
    if (mediaType === "tv") {
      reasons = ["El tipo de medio coincide con televisión."];
    } else if (mediaType === "cable") {
      reasons = [
        "El medio pertenece a una categoría audiovisual relacionada (cable), " +
          "pero no coincide plenamente con televisión abierta.",
      ];
    }
    if (profile.includes("nacional")) score += isNational(coverage, regions) ? 8.0 : 2.0;
    else score += 6.0;
  } else if (context.category_norm === "digital") {
    score += 8.0;
  } else if (context.category_norm === "prensa") {
    const wantsRegional = profile.includes("regional") || profile.includes("inserto");
    const national = isNational(coverage, regions);
    if (wantsRegional) score += !national ? 8.0 : 2.0;
    else score += national ? 8.0 : 2.0;
  } else {
    score += 6.0;
  }

  score = Math.min(maximum, score);
  return criterion("profile", "Afinidad con el perfil estratégico", score, maximum, reasons.join(" "));
}

function scoreCoverage(media, context) {
  const maximum = WEIGHTS.coverage;
  const profile = context.profile_norm;
  const coverage = norm(media.coverage);
  const regionsText = text(media.regions);
  const regions = norm(regionsText);
  const mediaDepartments = departmentsIn(regionsText);
  const campaignDepartments = context.campaign_departments;
  const national = isNational(coverage, regions);
  const localProfile = ["regional", "departamental", "territorial", "multilingue", "inserto"].some((token) =>
    profile.includes(token)
  );

  let score;
  let explanation;

  if (localProfile) {
    if (national) {
      score = 14.0;
      explanation =
        "Cubre la campaña, pero es una señal nacional y ofrece menos precisión " +
        "territorial que la solicitada por este perfil.";
    } else if (campaignDepartments.size === 0) {
      score = 20.0;
      explanation = "Tiene cobertura regional/departamental compatible.";
    } else {
      const common = intersect(mediaDepartments, campaignDepartments);
      if (common.size) {
        // En perfiles territoriales un medio local puede ser plenamente útil para su
        // zona aunque no cubra toda la campaña.
        score = 25.0;
        explanation =
          "Su cobertura territorial coincide con departamentos priorizados: " + [...common].sort().join(", ") + ".";
      } else {
        score = 6.0;
        explanation =
          "Es un medio territorial, pero no se detecta coincidencia con los " +
          "departamentos priorizados del Brief.";
      }
    }
  } else if (profile.includes("nacional") || profile.includes("alta cobertura")) {
    if (national) {
      score = 25.0;
      explanation = "La cobertura amplia/nacional coincide con el perfil recomendado.";
    } else if (profile.includes("alta cobertura") && mediaDepartments.size >= 7) {
      score = 22.0;
      explanation = "La presencia multidepartamental es compatible con el requisito de alta cobertura.";
    } else if (campaignDepartments.size && mediaDepartments.size) {
      const common = intersect(mediaDepartments, campaignDepartments);
      const ratio = common.size / Math.max(1, campaignDepartments.size);
      score = 8.0 + 12.0 * ratio;
      explanation =
        `La cobertura alcanza ${common.size} de ${campaignDepartments.size} departamentos priorizados; ` +
        "es parcial respecto del alcance amplio requerido.";
    } else {
      score = 8.0;
      explanation = "La cobertura no alcanza el nivel amplio requerido por el perfil.";
    }
  } else if (national) {
    score = 23.0;
    explanation = "La cobertura nacional incluye los territorios de campaña.";
  } else if (campaignDepartments.size && mediaDepartments.size) {
    const common = intersect(mediaDepartments, campaignDepartments);
    const ratio = common.size / Math.max(1, campaignDepartments.size);
    score = 10.0 + 13.0 * ratio;
    explanation =
      `La cobertura coincide con ${common.size} de ${campaignDepartments.size} departamentos priorizados; ` +
      "se puntúa de forma proporcional.";
  } else {
    score = 10.0;
    explanation = "No hay suficiente detalle territorial para una coincidencia completa.";
  }

  return criterion("coverage", "Cobertura y adecuación territorial", Math.min(maximum, score), maximum, explanation);
}

function scoreAudience(media, context) {
  const maximum = WEIGHTS.audience;
  const target = `${context.target_audience} ${context.campaign_audiences}`;
  const interests = norm(media.interests);
  const targetNorm = norm(target);

  const [ageScore, ageExplanation] = ageAffinity(target, text(media.ages));
  const agePoints = 10.0 * ageScore;

  const tags = audienceTags(context.profile_norm, targetNorm);
  let interestPoints;
  let interestExplanation;
  if (tags.length) {
    const matches = tags.filter((tag) => interests.includes(tag));
    interestPoints = 5.0 * (matches.length / tags.length);
    interestExplanation = matches.length
      ? "Afinidades detectadas: " + matches.join(", ") + "."
      : "No se detectan afinidades temáticas explícitas en el catálogo.";
  } else {
    interestPoints = 3.0;
    interestExplanation = "El Brief no permite comparar intereses de forma específica.";
  }

  const score = Math.min(maximum, agePoints + interestPoints);
  return criterion("audience", "Afinidad de audiencia", score, maximum, `${ageExplanation} ${interestExplanation}`);
}

function scoreLanguage(media, context) {
  const maximum = WEIGHTS.language;
  const languages = text(media.languages);

  if (!requiresMultilingual(context)) {
    return criterion(
      "language",
      "Adecuación lingüística",
      maximum,
      maximum,
      "El perfil no exige una condición lingüística adicional específica."
    );
  }

  let score;
  let explanation;
  if (isMultilingual(norm(languages))) {
    score = maximum;
    explanation = `El catálogo reporta oferta multilingüe: ${languages}.`;
  } else if (languages) {
    score = 3.0;
    explanation = `El catálogo solo reporta: ${languages}.`;
  } else {
    score = 0.0;
    explanation = "No hay información lingüística disponible.";
  }
  return criterion("language", "Adecuación lingüística", score, maximum, explanation);
}

function expectedFormatGroups(context) {
  const profile = context.profile_norm;
  const category = context.category_norm;
  if (category === "tv") return FORMAT_GROUPS.tv;
  if (category === "radio") return FORMAT_GROUPS.radio;
  if (category === "digital") return FORMAT_GROUPS.digital;
  if (category === "prensa") {
    return profile.includes("regional") || profile.includes("inserto")
      ? FORMAT_GROUPS.regional_press
      : FORMAT_GROUPS.press;
  }
  return [];
}

function scoreFormat(media, context) {
  const maximum = WEIGHTS.format;
  const products = productText(media);
  const expected = expectedFormatGroups(context);

  if (!expected.length) {
    return criterion(
      "format",
      "Compatibilidad de formato/producto",
      9.0,
      maximum,
      "No se pudo convertir el formato del Brief en reglas más específicas; se aplica puntuación neutral."
    );
  }

  let matchedGroups = 0;
  const matchedLabels = [];
  for (const group of expected) {
    if (group.some((term) => products.includes(norm(term)))) {
      matchedGroups += 1;
      matchedLabels.push(group[0]);
    }
  }

  const score = maximum * (matchedGroups / expected.length);
  const explanation = matchedLabels.length
    ? "El catálogo confirma elementos de formato: " + matchedLabels.join(", ") + "."
    : "No se encontró un producto que confirme el formato solicitado por el Brief.";
  return criterion("format", "Compatibilidad de formato/producto", score, maximum, explanation);
}

function scoreReach(media, context) {
  const maximum = WEIGHTS.reach;
  const profile = context.profile_norm;
  const reach = context.candidate_reaches.get(Number(media.id));
  const localProfile = ["regional", "departamental", "territorial", "multilingue", "inserto"].some((token) =>
    profile.includes(token)
  );

  if (reach === null || reach === undefined || reach <= 0) {
    return criterion(
      "reach",
      "Alcance / indicador cuantitativo",
      2.0,
      maximum,
      "No hay un alcance cuantificable para comparar; se evita asignar cero absoluto."
    );
  }

  let score;
  let explanation;
  if (localProfile) {
    score = 9.0;
    explanation =
      `El medio reporta un alcance cuantificable (${humanNumber(reach)}); ` +
      "en perfiles territoriales no se compara directamente contra señales nacionales.";
  } else {
    const maxReach = context.max_reach;
    if (!maxReach) {
      score = 7.0;
    } else {
      const ratio = Math.max(0.0, Math.min(1.0, reach / maxReach));
      score = 4.0 + 6.0 * Math.sqrt(ratio);
    }
    explanation = `Alcance comparable reportado: ${humanNumber(reach)}.`;
  }
  return criterion("reach", "Alcance / indicador cuantitativo", Math.min(maximum, score), maximum, explanation);
}

function scoreCost(media, context) {
  const maximum = WEIGHTS.cost;
  const id = Number(media.id);
  const cost = context.candidate_costs.get(id);
  const efficiency = context.candidate_efficiencies.get(id);
  const bestEfficiency = context.best_efficiency;

  if (cost === null || cost === undefined || cost <= 0) {
    return criterion(
      "cost",
      "Eficiencia económica",
      2.0,
      maximum,
      "No hay una tarifa comparable; se asigna un valor conservador y se reduce la confianza de datos."
    );
  }

  if (efficiency === null || efficiency === undefined || efficiency <= 0 || !bestEfficiency) {
    return criterion(
      "cost",
      "Eficiencia económica",
      3.0,
      maximum,
      `Existe una tarifa comparable de Q${formatThousands(cost, 2)}, pero faltan datos homogéneos de alcance para calcular eficiencia relativa.`
    );
  }

  const ratio = Math.max(0.0, Math.min(1.0, bestEfficiency / efficiency));
  const score = 1.5 + 3.5 * Math.sqrt(ratio);
  const metricText =
    context.category_norm === "digital"
      ? `CPM/CPC comparable reportado: Q${formatThousands(efficiency, 2)}.`
      : `Costo relativo estimado: Q${formatThousands(efficiency, 2)} por mil personas de alcance comparable.`;

  return criterion(
    "cost",
    "Eficiencia económica",
    Math.min(maximum, score),
    maximum,
    metricText + " Se usa solo para ordenar candidatos comparables; no sustituye la evaluación presupuestaria final."
  );
}

// ---------------------------------------------------------------------------
// Confianza de datos y requisitos críticos
// ---------------------------------------------------------------------------

function dataConfidence(media, context) {
  const profile = context.profile_norm;
  const needsLanguage = requiresMultilingual(context);
  const products = media.products || [];
  const hasProductFormat = products.some((product) => Boolean(text(product.format)));
  const hasProductIndicator = products.some(
    (product) => parseNumber(product.rating) !== null || parseNumber(product.estimated_audience) !== null
  );

  const checks = [
    ["cobertura", 15, Boolean(text(media.coverage))],
    ["regiones", 15, Boolean(text(media.regions))],
    ["alcance", 15, candidateReach(media) !== null],
    ["audiencia/edades", 10, Boolean(text(media.ages))],
    ["NSE", 5, Boolean(text(media.nse))],
    ["productos", 15, products.length > 0],
    ["formato de producto", 10, hasProductFormat],
    ["tarifa", 10, candidateCost(media) !== null],
    ["indicador/rating/audiencia de producto", 5, hasProductIndicator],
    ["idiomas", needsLanguage ? 10 : 5, Boolean(text(media.languages))],
  ];

  const totalWeight = checks.reduce((sum, [, weight]) => sum + weight, 0);
  const completedWeight = checks.reduce((sum, [, weight, ok]) => sum + (ok ? weight : 0), 0);
  let confidence = roundHalfEven((100 * completedWeight) / Math.max(1, totalWeight), 0);
  const missing = checks.filter(([, , ok]) => !ok).map(([name]) => name);

  const notes = [];
  if (missing.length) notes.push("Datos faltantes o no verificables: " + missing.join(", ") + ".");
  else notes.push("El catálogo contiene los campos generales requeridos por esta versión del scoring.");

  const validity = text(media.rate_card_validity);
  if (validity) {
    notes.push(`Vigencia de tarifario reportada: ${validity}.`);
  } else if (candidateCost(media) !== null) {
    confidence = Math.max(0, confidence - 5);
    notes.push("Hay tarifa, pero no se reporta vigencia del tarifario; confianza -5 puntos.");
  }

  // La confianza mide suficiencia de información para ESTE perfil, no solo que las
  // columnas del Excel estén llenas.
  const territorialProfile = ["regional", "territorial", "departamental", "inserto"].some((token) =>
    profile.includes(token)
  );
  if (territorialProfile && departmentsIn(media.regions).size === 0) {
    confidence = Math.max(0, confidence - 10);
    notes.push(
      "El perfil es territorial y la cobertura no está desglosada por " +
        "departamentos reconocibles; confianza -10 puntos."
    );
  }

  if (needsLanguage && !text(media.languages)) {
    confidence = Math.max(0, confidence - 10);
    notes.push(
      "El perfil requiere información lingüística y el catálogo no la aporta; " +
        "confianza -10 puntos adicionales."
    );
  }

  return [Math.max(0, Math.min(100, confidence)), notes];
}

function criticalRequirements(media, context, criteria) {
  const failures = [];
  const profile = context.profile_norm;
  const coverage = norm(media.coverage);
  const regions = norm(media.regions);
  const mediaDepartments = departmentsIn(media.regions);
  const campaignDepartments = context.campaign_departments;

  if (requiresMultilingual(context) && !isMultilingual(norm(media.languages))) {
    failures.push({
      key: "language",
      reason: "El perfil requiere capacidad multilingüe o idiomas locales y el catálogo no la confirma.",
    });
  }

  if (profile.includes("nacional") && !isNational(coverage, regions)) {
    failures.push({
      key: "coverage",
      reason: "El perfil exige cobertura nacional y este medio no la acredita.",
    });
  }

  const localProfile = ["regional", "departamental", "territorial", "inserto"].some((token) =>
    profile.includes(token)
  );
  if (
    localProfile &&
    !isNational(coverage, regions) &&
    campaignDepartments.size &&
    mediaDepartments.size &&
    intersect(mediaDepartments, campaignDepartments).size === 0
  ) {
    failures.push({
      key: "territory",
      reason: "La cobertura territorial no coincide con los departamentos priorizados en el Brief.",
    });
  }

  const formatCriterion = criteria.find((item) => item.key === "format");
  if (formatCriterion && formatCriterion.maximum > 0) {
    if (formatCriterion.score / formatCriterion.maximum < 0.5) {
      failures.push({
        key: "format",
        reason: "No se confirma un formato/producto técnicamente compatible con el solicitado.",
      });
    }
  }

  return failures;
}

function compatibilityLabel(score) {
  if (score >= 90) return "muy_alta";
  if (score >= 75) return "alta";
  if (score >= 60) return "media";
  if (score >= 40) return "baja";
  return "muy_baja";
}

// ---------------------------------------------------------------------------
// Puntuación de un candidato y ranking
// ---------------------------------------------------------------------------

function buildContext(summary, recommendation, candidates) {
  const fields = recommendation.fields || {};
  const targetAudience = fieldValue(fields, "6.2");
  const technical = fieldValue(fields, "6.3");
  const materialFormat = fieldValue(fields, "6.5");
  const profile = text(recommendation.profile);
  const category = text(recommendation.category);

  const summaryFields = summary.fields || {};
  const campaignTerritory = fieldValue(summaryFields, "1.3");
  const campaignAudiences = ["3.3", "3.4", "3.5"]
    .map((fieldId) => fieldValue(summaryFields, fieldId))
    .join(" ")
    .trim();

  const candidateCosts = new Map();
  const candidateReaches = new Map();
  const candidateEfficiencies = new Map();
  for (const item of candidates) {
    const id = Number(item.id);
    candidateCosts.set(id, candidateCost(item));
    candidateReaches.set(id, candidateReach(item));
    candidateEfficiencies.set(id, candidateCostEfficiency(item, category));
  }
  const positive = (map) => [...map.values()].filter((value) => value !== null && value > 0);
  const reaches = positive(candidateReaches);
  const efficiencies = positive(candidateEfficiencies);

  return {
    profile,
    profile_norm: norm(profile),
    category,
    category_norm: norm(category),
    target_audience: targetAudience,
    target_audience_norm: norm(targetAudience),
    technical,
    technical_norm: norm(technical),
    material_format: materialFormat,
    material_format_norm: norm(materialFormat),
    campaign_territory: campaignTerritory,
    campaign_departments: departmentsIn(campaignTerritory),
    campaign_audiences: campaignAudiences,
    campaign_audiences_norm: norm(campaignAudiences),
    candidate_costs: candidateCosts,
    candidate_reaches: candidateReaches,
    max_reach: reaches.length ? Math.max(...reaches) : null,
    candidate_efficiencies: candidateEfficiencies,
    best_efficiency: efficiencies.length ? Math.min(...efficiencies) : null,
  };
}

function scoreCandidate(media, context) {
  const criteria = [
    scoreProfile(media, context),
    scoreCoverage(media, context),
    scoreAudience(media, context),
    scoreLanguage(media, context),
    scoreFormat(media, context),
    scoreReach(media, context),
    scoreCost(media, context),
  ];
  const total = criteria.reduce((sum, item) => sum + item.score, 0);
  const [confidence, confidenceNotes] = dataConfidence(media, context);
  const criticalFailures = criticalRequirements(media, context, criteria);

  const warnings = [];
  if (!(media.products || []).length) {
    warnings.push("El medio no tiene productos comerciales asociados en el catálogo.");
  }
  if (candidateCost(media) === null) warnings.push("No hay una tarifa comparable disponible para este medio.");
  if (confidence < 70) warnings.push("La recomendación se apoya en datos incompletos del catálogo.");
  if (criticalFailures.length) {
    warnings.push("Compatibilidad condicionada: existe al menos un requisito crítico no satisfecho.");
  }

  return {
    media_id: Number(media.id),
    media_name: text(media.name),
    media_type: text(media.media_type),
    score: roundHalfEven(total, 2),
    score_max: 100.0,
    compatibility: criticalFailures.length ? "condicionada" : compatibilityLabel(total),
    critical_requirements_met: criticalFailures.length === 0,
    critical_failures: criticalFailures,
    data_confidence: confidence,
    coverage: text(media.coverage),
    regions: text(media.regions),
    languages: text(media.languages),
    reach: text(media.reach),
    ages: text(media.ages),
    nse: text(media.nse),
    minimum_investment: text(media.minimum_investment),
    best_comparable_cost: candidateCost(media),
    criteria: criteria.map(criterionAsDict),
    confidence_notes: confidenceNotes,
    warnings,
  };
}

function allowedTypes(category) {
  return CATEGORY_TO_MEDIA_TYPES[norm(category)] || [];
}

const byString = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Ranking de una recomendación del Brief.
 * @param {object} args
 * @param {object} args.summary         resumen del expediente (campos del Brief)
 * @param {object} args.recommendation  recomendación (profile, category, fields)
 * @param {object[]} args.catalog       medios del catálogo con `products`, ordenados por (media_type, name)
 * @param {number} [args.limit]
 */
function rankRecommendation({ summary, recommendation, catalog, limit = 10 }) {
  const profile = text(recommendation.profile);
  const category = text(recommendation.category);
  if (!profile || !category) {
    throw new ValidationError("La recomendación debe incluir profile y category.");
  }

  const types = allowedTypes(category);
  if (!types.length) {
    return { profile, category, status: "unsupported_category", count: 0, items: [] };
  }

  const candidates = catalog.filter((media) => types.includes(norm(media.media_type)));
  if (!candidates.length) {
    return { profile, category, status: "no_candidates", count: 0, items: [] };
  }

  const context = buildContext(summary, recommendation, candidates);
  const scored = candidates.map((item) => scoreCandidate(item, context));
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.data_confidence - a.data_confidence ||
      byString(norm(a.media_name), norm(b.media_name))
  );

  const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 1, 100));
  return {
    profile,
    category,
    status: "completed",
    method: METHOD,
    weights: { ...WEIGHTS },
    count: Math.min(scored.length, safeLimit),
    candidate_count: scored.length,
    items: scored.slice(0, safeLimit),
  };
}

/** Ranking de todas las recomendaciones del Brief de un resumen. */
function rankAll({ summary, catalog, limitPerProfile = 5 }) {
  const recommendations = summary.media_recommendations || [];
  if (!Array.isArray(recommendations)) {
    throw new ValidationError("media_recommendations no tiene una estructura válida.");
  }
  return recommendations
    .filter(isPlainObject)
    .map((recommendation) => rankRecommendation({ summary, recommendation, catalog, limit: limitPerProfile }));
}

module.exports = { METHOD, WEIGHTS, rankRecommendation, rankAll, compatibilityLabel };
