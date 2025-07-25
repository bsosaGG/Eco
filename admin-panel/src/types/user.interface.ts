export interface IUser {
  id_usuario: number
  email: string
  nombre_completo: string
  rol: 'admin' | 'usuario'
  activo: boolean
  correo_validado?: boolean
  fecha_creacion?: string
  ultimo_login?: string
  profileIds?: number[]
  directPermissionIds?: number[]
}
