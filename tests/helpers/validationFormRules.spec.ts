import { describe, expect, it } from "vitest"
import { validationRules as rules } from "~/helpers/validationFormRules"

const REQUIRED = "Este campo es requerido"

describe("rules.required", () => {
  it.each([null, undefined, "", "   ", "\t\n"])("rejects %j", (value) => {
    expect(rules.required(value as any)).toBe(REQUIRED)
  })

  it.each(["a", " a ", 0, 12.5, true, false])("accepts %j", (value) => {
    expect(rules.required(value as any)).toBe(true)
  })
})

describe("rules.email", () => {
  it.each(["a@b.co", "usuario.nombre@salon.com.pe", " a@b.co "])("accepts %j", (value) => {
    expect(rules.email(value)).toBe(true)
  })

  it.each(["", "a", "a@b", "a b@c.com", "@c.com"])("rejects %j", (value) => {
    expect(rules.email(value)).toBe("Correo inválido")
  })
})

describe("numbers", () => {
  it("number / decimal", () => {
    expect(rules.number("12.5")).toBe(true)
    expect(rules.number("abc")).toBe("Debe ser un número válido")
    expect(rules.decimal("12.50")).toBe(true)
    expect(rules.decimal("-3")).toBe(true)
    expect(rules.decimal("1,5")).toBe("Debe ser un número decimal válido")
  })

  it("positiveNumber accepts 0 and rejects negatives", () => {
    expect(rules.positiveNumber(0)).toBe(true)
    expect(rules.positiveNumber("-0.01")).toBe("Debe ser mayor o igual a 0")
  })

  it("money allows at most two decimals (the price columns hold cents)", () => {
    expect(rules.money("10")).toBe(true)
    expect(rules.money("10.5")).toBe(true)
    expect(rules.money("10.55")).toBe(true)
    expect(rules.money("10.555")).toBe("Máximo 2 decimales")
    expect(rules.money("-1")).toBe("Máximo 2 decimales")
  })

  it("commissionPercentage is required and between 0 and 100 (the backend's @DecimalMin / @DecimalMax)", () => {
    expect(rules.commissionPercentage("")).toBe(REQUIRED)
    expect(rules.commissionPercentage(null as any)).toBe(REQUIRED)
    expect(rules.commissionPercentage("abc")).toBe("Debe ser un número válido")
    expect(rules.commissionPercentage(-1)).toBe("Debe estar entre 0 y 100")
    expect(rules.commissionPercentage(100.01)).toBe("Debe estar entre 0 y 100")
    expect(rules.commissionPercentage(0)).toBe(true)
    expect(rules.commissionPercentage(100)).toBe(true)
    expect(rules.commissionPercentage("12.5")).toBe(true)
  })

  it("greaterThanZero refuses 0 (the backend's @Positive), wholeNumber refuses fractions (Integer fields)", () => {
    expect(rules.greaterThanZero(0)).toBe("Debe ser mayor a 0")
    expect(rules.greaterThanZero("-1")).toBe("Debe ser mayor a 0")
    expect(rules.greaterThanZero("0.01")).toBe(true)
    expect(rules.wholeNumber(3)).toBe(true)
    expect(rules.wholeNumber("")).toBe(true)
    expect(rules.wholeNumber(1.5)).toBe("Debe ser un número entero")
  })

  it("maxIntegerDigits keeps a value inside the NUMERIC columns", () => {
    const eight = rules.maxIntegerDigits(8)
    expect(eight("")).toBe(true)
    expect(eight(null)).toBe(true)
    expect(eight("12345678")).toBe(true)
    expect(eight("12345678.99")).toBe(true)
    expect(eight("123456789")).toBe("Máximo 8 dígitos enteros")
    expect(eight("123456789.5")).toBe("Máximo 8 dígitos enteros")
  })

  it("onlyNumbers lets empty pass", () => {
    expect(rules.onlyNumbers("")).toBe(true)
    expect(rules.onlyNumbers("123")).toBe(true)
    expect(rules.onlyNumbers("12a")).toBe("Solo números")
  })
})

describe("Peruvian data", () => {
  it("ruc: empty or 11 digits starting with 10, 15, 16, 17 or 20", () => {
    expect(rules.ruc("")).toBe(true)
    expect(rules.ruc("20123456789")).toBe(true)
    expect(rules.ruc("10123456789")).toBe(true)
    expect(rules.ruc("30123456789")).toBe("RUC inválido")
    expect(rules.ruc("2012345678")).toBe("RUC inválido")
  })

  it("phone: empty or exactly 9 digits", () => {
    expect(rules.phone("")).toBe(true)
    expect(rules.phone("987654321")).toBe(true)
    expect(rules.phone("98765432")).toBe("Teléfono inválido (9 dígitos)")
    expect(rules.phone("98765432a")).toBe("Teléfono inválido (9 dígitos)")
  })

  it("textOnly accepts letters, accents and spaces", () => {
    expect(rules.textOnly("María Núñez")).toBe(true)
    expect(rules.textOnly("Ana2")).toBe("Solo se permiten letras")
  })
})

describe("lengths and passwords", () => {
  it("maxLength lets empty values pass and cuts at the limit", () => {
    expect(rules.maxLength(3)("")).toBe(true)
    expect(rules.maxLength(3)("abc")).toBe(true)
    expect(rules.maxLength(3)("abcd")).toBe("Máximo 3 caracteres")
  })

  it("minLength counts characters", () => {
    expect(rules.minLength(8)("12345678")).toBe(true)
    expect(rules.minLength(8)("1234567")).toBe("Debe tener al menos 8 caracteres")
  })

  it("matchPassword compares with the other field", () => {
    expect(rules.matchPassword("clave-123")("clave-123")).toBe(true)
    expect(rules.matchPassword("clave-123")("clave-124")).toBe("Las contraseñas no coinciden")
  })
})
