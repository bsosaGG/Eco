document.addEventListener("DOMContentLoaded", () => {
  // Esperar a que el DOM esté listo
  const resetForm = document.getElementById("resetForm");
  if (resetForm) {
    resetForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const password = document.getElementById("password").value;
      const confirm_password =
        document.getElementById("confirm_password").value;
      const messageDiv = document.getElementById("messageDiv");
      messageDiv.style.display = "none";
      messageDiv.className = "message";

      if (password !== confirm_password) {
        messageDiv.textContent = "Las contraseñas no coinciden.";
        messageDiv.classList.add("error");
        messageDiv.style.display = "block";
        return;
      }
      if (password.length < 8) {
        messageDiv.textContent =
          "La contraseña debe tener al menos 8 caracteres.";
        messageDiv.classList.add("error");
        messageDiv.style.display = "block";
        return;
      }

      try {
        const response = await fetch(this.action, {
          // this.action tomará el action del form
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: password,
            confirm_password: confirm_password,
          }),
        });
        const result = await response.json();
        messageDiv.textContent = result.message;
        if (response.ok) {
          messageDiv.classList.add("success");
          this.reset();
          document.querySelector('button[type="submit"]').disabled = true;
        } else {
          messageDiv.classList.add("error");
        }
      } catch (e) {
        console.error("Error en el fetch:", e);
        messageDiv.textContent = "Error de red o del servidor.";
        messageDiv.classList.add("error");
      }
      messageDiv.style.display = "block";
    });
  }
});
