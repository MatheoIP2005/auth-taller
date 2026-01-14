// ============================================
// IMPORTACIONES DE VALIDADORES
// ============================================

// class-validator: Librería que nos permite validar datos automáticamente
// Estos decoradores se aplican a las propiedades de la clase
import {
    IsEmail,      // Valida que sea un email válido
    IsString,     // Valida que sea una cadena de texto
    MinLength,    // Valida longitud mínima de caracteres
    MaxLength,    // Valida longitud máxima de caracteres
} from 'class-validator';

// ============================================
// DTO DE REGISTRO
// ============================================

/**
 * RegisterDto - Data Transfer Object para el registro de usuarios
 * 
 * ¿QUÉ ES UN DTO?
 * - DTO = Data Transfer Object (Objeto de Transferencia de Datos)
 * - Define la estructura de los datos que el cliente debe enviar
 * - Incluye validaciones automáticas usando decoradores
 * 
 * ¿CUÁNDO SE USA?
 * - Cuando un usuario se registra en el sistema (POST /auth/register)
 * 
 * ¿QUÉ HACE?
 * - Valida automáticamente los datos antes de que lleguen al servicio
 * - Si hay errores, retorna 400 Bad Request con mensajes descriptivos
 * - Si todo es válido, los datos pasan al AuthService
 * 
 * CAMPOS QUE SE SOLICITAN:
 * 1. username - Nombre de usuario único
 * 2. email - Correo electrónico único
 * 3. password - Contraseña en texto plano (se hasheará en el servicio)
 * 
 * CAMPOS QUE NO SE SOLICITAN (se generan automáticamente):
 * - id: Lo genera la base de datos
 * - isActive: Tiene valor por defecto (true)
 * - createdAt: Se genera automáticamente
 * - updatedAt: Se genera automáticamente
 * 
 * EJEMPLO DE BODY EN POSTMAN:
 * {
 *   "username": "juanperez",
 *   "email": "juan@test.com",
 *   "password": "miPassword123"
 * }
 */
export class RegisterDto {

    // ==========================================
    // CAMPO: USERNAME (Nombre de usuario)
    // ==========================================

    // @IsString(): Valida que sea una cadena de texto
    // - Si envían un número: 123 → Error
    // - Si envían un objeto: {} → Error
    // - Si envían un string: "juan" → ✓ Válido
    @IsString({
        message: 'El nombre de usuario debe ser una cadena de texto'
    })

    // @MinLength(3): Valida que tenga mínimo 3 caracteres
    // - "ju" → Error (muy corto)
    // - "juan" → ✓ Válido
    // El objeto { message } personaliza el mensaje de error
    @MinLength(3, {
        message: 'El nombre de usuario debe tener al menos 3 caracteres'
    })

    // @MaxLength(50): Valida que no exceda 50 caracteres
    // - Coincide con la longitud máxima definida en User.entity (varchar 50)
    // - Previene errores de base de datos por exceso de caracteres
    @MaxLength(50, {
        message: 'El nombre de usuario no puede exceder 50 caracteres'
    })

    // Propiedad username de tipo string
    // Este valor será usado para crear el usuario en la base de datos
    username: string;

    // ==========================================
    // CAMPO: EMAIL (Correo electrónico)
    // ==========================================

    // @IsEmail(): Valida que sea un email válido
    // - "juan@test.com" → ✓ Válido
    // - "juan@test" → Error (falta dominio completo)
    // - "juantest.com" → Error (falta @)
    // - "juan@" → Error (falta dominio)
    // 
    // VALIDACIÓN INTERNA:
    // - Verifica formato: usuario@dominio.extension
    // - Acepta subdominios: juan@mail.empresa.com
    // - Acepta caracteres especiales permitidos: juan.perez+tag@test.com
    @IsEmail({}, {
        message: 'Debe proporcionar un email válido'
    })

    // @MaxLength(100): Valida que no exceda 100 caracteres
    // - Coincide con la longitud máxima definida en User.entity (varchar 100)
    // - Previene direcciones de email excesivamente largas
    @MaxLength(100, {
        message: 'El email no puede exceder 100 caracteres'
    })

    // Propiedad email de tipo string
    // IMPORTANTE: Este email debe ser único en la base de datos
    // La validación de unicidad se hace en AuthService, no aquí
    email: string;

    // ==========================================
    // CAMPO: PASSWORD (Contraseña)
    // ==========================================

    // @IsString(): Valida que sea una cadena de texto
    @IsString({
        message: 'La contraseña debe ser una cadena de texto'
    })

    // @MinLength(6): Valida que tenga mínimo 6 caracteres
    // - "123" → Error (muy corta, insegura)
    // - "123456" → ✓ Válido (pero débil)
    // - "miPassword123" → ✓ Válido (más segura)
    // 
    // NOTA DE SEGURIDAD:
    // - 6 caracteres es el MÍNIMO para este taller
    // - En producción, considera:
    //   • Mínimo 8-12 caracteres
    //   • Validar complejidad (mayúsculas, números, símbolos)
    //   • Usar decoradores personalizados para validación de fuerza
    @MinLength(6, {
        message: 'La contraseña debe tener al menos 6 caracteres'
    })

    // @MaxLength(255): Valida que no exceda 255 caracteres
    // - Aunque el hash será de tamaño fijo, limitamos el input
    // - Previene ataques de denegación de servicio con passwords enormes
    @MaxLength(255, {
        message: 'La contraseña no puede exceder 255 caracteres'
    })

    // Propiedad password de tipo string
    // IMPORTANTE: Este password llegará en TEXTO PLANO desde el cliente
    // - En AuthService se hasheará usando bcrypt antes de guardarlo
    // - NUNCA se guarda en texto plano en la base de datos
    // - El hash resultante de bcrypt siempre tiene 60 caracteres
    password: string;

    // ==========================================
    // FLUJO DE VALIDACIÓN AUTOMÁTICA
    // ==========================================

    // Cuando un cliente hace POST /auth/register con este body:
    // {
    //   "username": "ju",
    //   "email": "no-es-email",
    //   "password": "123"
    // }
    //
    // NestJS valida AUTOMÁTICAMENTE (gracias a ValidationPipe en main.ts):
    // 
    // 1. Verifica @IsString() en username → ✓ Pass (es string)
    // 2. Verifica @MinLength(3) en username → ✗ FAIL
    //    → Retorna: "El nombre de usuario debe tener al menos 3 caracteres"
    // 
    // 3. Verifica @IsEmail() en email → ✗ FAIL
    //    → Retorna: "Debe proporcionar un email válido"
    // 
    // 4. Verifica @MinLength(6) en password → ✗ FAIL
    //    → Retorna: "La contraseña debe tener al menos 6 caracteres"
    //
    // RESPUESTA HTTP:
    // Status: 400 Bad Request
    // Body: {
    //   "statusCode": 400,
    //   "message": [
    //     "El nombre de usuario debe tener al menos 3 caracteres",
    //     "Debe proporcionar un email válido",
    //     "La contraseña debe tener al menos 6 caracteres"
    //   ],
    //   "error": "Bad Request"
    // }
    //
    // Si TODAS las validaciones pasan:
    // → Los datos se pasan al controlador
    // → El controlador llama a AuthService.register(registerDto)
    // → AuthService procesa el registro

    // ==========================================
    // NOTAS ADICIONALES
    // ==========================================

    // VALIDACIONES QUE PODRÍAS AGREGAR:

    /**
     * Validar que el username no tenga espacios:
     * 
     * @Matches(/^\S+$/, { 
     *   message: 'El nombre de usuario no puede contener espacios' 
     * })
     */

    /**
     * Validar formato del username (solo letras, números y guiones):
     * 
     * @Matches(/^[a-zA-Z0-9_-]+$/, { 
     *   message: 'El username solo puede contener letras, números, guiones y guiones bajos' 
     * })
     */

    /**
     * Validar complejidad de la contraseña:
     * 
     * @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
     *   message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
     * })
     */

    /**
     * Agregar campo de confirmación de contraseña:
     * 
     * @IsString()
     * @MinLength(6)
     * passwordConfirm: string;
     * 
     * // Luego validar en AuthService que password === passwordConfirm
     */
}