// ============================================
// IMPORTACIONES DE VALIDADORES
// ============================================

// class-validator: Librería para validar datos automáticamente
import {
    IsEmail,      // Valida que sea un email válido
    IsString,     // Valida que sea una cadena de texto
} from 'class-validator';

// ============================================
// DTO DE LOGIN
// ============================================

/**
 * LoginDto - Data Transfer Object para el inicio de sesión
 * 
 * ¿QUÉ ES UN DTO DE LOGIN?
 * - Define la estructura de datos que el cliente debe enviar para autenticarse
 * - Incluye validaciones automáticas de los campos de credenciales
 * 
 * ¿CUÁNDO SE USA?
 * - Cuando un usuario ya registrado quiere iniciar sesión (POST /auth/login)
 * 
 * ¿QUÉ HACE?
 * - Valida que el email tenga formato correcto
 * - Valida que la contraseña sea una cadena de texto
 * - Si las validaciones fallan, retorna 400 Bad Request
 * - Si pasan, los datos se envían al AuthService para autenticación
 * 
 * DIFERENCIA CON RegisterDto:
 * - RegisterDto: Se usa para CREAR un nuevo usuario (necesita username, email, password)
 * - LoginDto: Se usa para AUTENTICAR un usuario existente (solo necesita email, password)
 * - LoginDto NO necesita username porque el login se hace solo con email
 * 
 * CAMPOS REQUERIDOS:
 * 1. email - Para identificar al usuario
 * 2. password - Para validar la identidad
 * 
 * EJEMPLO DE BODY EN POSTMAN:
 * {
 *   "email": "juan@test.com",
 *   "password": "miPassword123"
 * }
 * 
 * FLUJO DESPUÉS DE LA VALIDACIÓN:
 * 1. LoginDto valida el formato de los datos
 * 2. AuthService busca el usuario por email
 * 3. AuthService compara el password con el hash guardado
 * 4. Si coincide, genera y retorna un token JWT
 * 5. El cliente usa ese token para acceder a rutas protegidas
 */
export class LoginDto {

    // ==========================================
    // CAMPO: EMAIL (Correo electrónico)
    // ==========================================

    // @IsEmail(): Valida que sea un email con formato válido
    // - "juan@test.com" → ✓ Válido
    // - "juan@test" → Error (falta extensión de dominio)
    // - "juantest.com" → Error (falta @)
    // - "juan@" → Error (falta dominio)
    // - "" (vacío) → Error (campo requerido)
    //
    // IMPORTANTE: Solo valida el FORMATO del email, NO valida que exista
    // La validación de existencia se hace en AuthService.login()
    @IsEmail({}, {
        message: 'Debe proporcionar un email válido'
    })

    // Propiedad email de tipo string
    // Este email se usará para buscar al usuario en la base de datos
    // El método usersService.findByEmail(email) buscará este email
    email: string;

    // ==========================================
    // CAMPO: PASSWORD (Contraseña)
    // ==========================================

    // @IsString(): Valida que sea una cadena de texto
    // - "miPassword123" → ✓ Válido
    // - 123456 → Error (es un número, no string)
    // - null → Error (no es string)
    // - undefined → Error (no es string)
    // - "" (vacío) → ✓ Técnicamente válido como string, pero será rechazado en AuthService
    //
    // NOTA: NO validamos longitud mínima aquí por seguridad
    // ¿Por qué?
    // - Si un usuario tiene una contraseña corta registrada (migración, datos antiguos, etc.)
    // - Debe poder iniciar sesión aunque su password sea corto
    // - La validación de longitud solo aplica en el REGISTRO
    @IsString({
        message: 'La contraseña debe ser una cadena de texto'
    })

    // Propiedad password de tipo string
    // IMPORTANTE: Este password llega en TEXTO PLANO desde el cliente
    // - NO se envía hasheado desde el cliente (eso sería inútil)
    // - El servidor lo comparará con el hash almacenado usando bcrypt.compare()
    // - NUNCA se almacena el password de login, solo se usa para comparación
    //
    // FLUJO DE VERIFICACIÓN:
    // 1. Cliente envía: { email: "juan@test.com", password: "miPassword123" }
    // 2. Servidor busca usuario por email
    // 3. Servidor ejecuta: bcrypt.compare("miPassword123", user.password)
    // 4. bcrypt.compare() hashea "miPassword123" y lo compara con el hash guardado
    // 5. Si coinciden → login exitoso, genera JWT
    // 6. Si no coinciden → lanza UnauthorizedException
    password: string;

    // ==========================================
    // FLUJO DE VALIDACIÓN AUTOMÁTICA
    // ==========================================

    // CASO 1: Datos inválidos
    // Cliente envía:
    // {
    //   "email": "esto-no-es-email",
    //   "password": 123456
    // }
    //
    // Validación automática de NestJS:
    // 1. @IsEmail() en email → ✗ FAIL
    //    → Error: "Debe proporcionar un email válido"
    // 2. @IsString() en password → ✗ FAIL
    //    → Error: "La contraseña debe ser una cadena de texto"
    //
    // Respuesta HTTP:
    // Status: 400 Bad Request
    // Body: {
    //   "statusCode": 400,
    //   "message": [
    //     "Debe proporcionar un email válido",
    //     "La contraseña debe ser una cadena de texto"
    //   ],
    //   "error": "Bad Request"
    // }
    //
    // CASO 2: Validación pasa, pero credenciales incorrectas
    // Cliente envía:
    // {
    //   "email": "usuario@noexiste.com",
    //   "password": "passwordIncorrecto"
    // }
    //
    // Validación automática:
    // 1. @IsEmail() → ✓ PASS (formato correcto)
    // 2. @IsString() → ✓ PASS (es string)
    //
    // AuthService.login():
    // 1. Busca usuario por email → No encontrado
    // 2. Lanza UnauthorizedException
    //
    // Respuesta HTTP:
    // Status: 401 Unauthorized
    // Body: {
    //   "statusCode": 401,
    //   "message": "Credenciales inválidas",
    //   "error": "Unauthorized"
    // }
    //
    // CASO 3: Login exitoso
    // Cliente envía:
    // {
    //   "email": "juan@test.com",
    //   "password": "miPassword123"
    // }
    //
    // Validación automática:
    // 1. @IsEmail() → ✓ PASS
    // 2. @IsString() → ✓ PASS
    //
    // AuthService.login():
    // 1. Busca usuario por email → Encontrado
    // 2. Compara password → Coincide
    // 3. Genera token JWT
    // 4. Retorna token y datos del usuario
    //
    // Respuesta HTTP:
    // Status: 201 Created (o 200 OK)
    // Body: {
    //   "message": "Login exitoso",
    //   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    //   "user": {
    //     "id": 1,
    //     "username": "juanperez",
    //     "email": "juan@test.com"
    //   }
    // }

    // ==========================================
    // NOTAS ADICIONALES
    // ==========================================

    // ¿POR QUÉ NO VALIDAMOS MÁS COSAS EN LoginDto?
    //
    // 1. NO validamos longitud mínima de password:
    //    - El usuario ya está registrado con esa contraseña
    //    - Aunque sea corta, debe poder iniciar sesión
    //    - La validación de longitud solo aplica en registro
    //
    // 2. NO validamos que el email exista:
    //    - Eso se hace en AuthService
    //    - Por seguridad, no revelamos si un email existe o no
    //    - Siempre retornamos "Credenciales inválidas" (genérico)
    //
    // 3. NO validamos formato complejo de password:
    //    - El usuario puede tener passwords de formatos antiguos
    //    - Solo verificamos que sea string
    //
    // SEGURIDAD: Mensaje genérico en errores de login
    // ✓ CORRECTO: "Credenciales inválidas"
    // ✗ INCORRECTO: "El email no existe" o "La contraseña es incorrecta"
    //
    // ¿Por qué mensaje genérico?
    // - Previene ataques de enumeración de usuarios
    // - Un atacante no puede saber si un email existe en el sistema
    // - Dificulta ataques de fuerza bruta

    // VALIDACIONES OPCIONALES QUE PODRÍAS AGREGAR:

    /**
     * Limitar intentos de login:
     * - No se hace en el DTO, se hace en AuthService
     * - Usar rate limiting o registro de intentos fallidos
     * - Bloquear temporalmente después de X intentos
     */

    /**
     * Recordar sesión (Remember Me):
     * 
     * @IsBoolean()
     * @IsOptional()
     * rememberMe?: boolean;
     * 
     * // Usar para generar tokens con mayor duración
     * // Normal: 1 hora, Remember Me: 30 días
     */

    /**
     * Login con username en lugar de email:
     * - Modificar para aceptar email O username
     * - En AuthService, buscar por ambos campos
     * 
     * @IsString()
     * emailOrUsername: string;
     * 
     * @IsString()
     * password: string;
     */
}