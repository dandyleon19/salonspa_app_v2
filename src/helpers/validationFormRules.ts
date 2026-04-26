export const validationRules = {
  required: (value: string | number) =>
    !!value || "Este campo es requerido",

  textOnly: (value: string) =>
    /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]*$/.test(value) || "Solo se permiten letras",

  email: (value: string) =>
    /^\S+@\S+\.\S+$/.test(value) || "Correo inválido",

  number: (value: string | number) =>
    !isNaN(Number(value)) || "Debe ser un número válido",

  decimal: (value: string | number) =>
    /^-?\d+(\.\d+)?$/.test(String(value)) || "Debe ser un número válido (entero o decimal)",

  minLength:
    (min: number) =>
    (value: string) =>
      value?.length >= min || `Debe tener al menos ${min} caracteres`,

  matchPassword:
    (password: string) =>
    (value: string) =>
      value === password || "Las contraseñas no coinciden",

  ruc: (v: string) =>
      !v ||
      /^(10|15|16|17|20)\d{9}$/.test(v) ||
      'RUC inválido',

  phone: (v: string) =>
      !v ||
      /^\d{9}$/.test(v) ||
      'Teléfono inválido (9 dígitos)',

  onlyNumbers: (v: string) =>
      !v ||
      /^\d+$/.test(v) ||
      'Solo números'
};