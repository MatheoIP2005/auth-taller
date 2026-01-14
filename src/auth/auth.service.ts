// ============================================
// IMPORTACIONES
// ============================================

// Importamos excepciones de NestJS para manejar errores
import {
    Injectable,              // Decorador para marcar esta clase como un servicio inyectable
    ConflictException,       // Excepción 409: Se usa cuando hay conflicto (ej: email duplicado)
    UnauthorizedException,   // Excepción 401: Se usa cuando las credenciales son inválidas
    NotFoundException        // Excepción 404: Se usa cuando no se encuentra un recurso
} from '@nestjs/common';

// JwtService: Servicio de NestJS para generar y verificar tokens JWT
import { JwtService } from '@nestjs/jwt';

// UsersService: Nuestro servicio para interactuar con los usuarios
import { UsersService } from '../users/users.service';

// DTOs para validación de datos
import { RegisterDto } from '../users/dto/register.dto';
import { LoginDto } from '../users/dto/login.dto';

// bcrypt: Librería para hashear y comparar contraseñas de forma segura
import * as bcrypt from 'bcrypt';

// ============================================
// SERVICIO DE AUTENTICACIÓN
// ============================================

/**
 * AuthService - Servicio principal de autenticación
 * 
 * RESPONSABILIDADES:
 * 1. Registro de nuevos usuarios con contraseñas hasheadas
 * 2. Login de usuarios existentes con generación de JWT
 * 3. Obtener perfil de usuarios autenticados
 * 
 * SEGURIDAD:
 * - Contraseñas hasheadas con bcrypt (factor de costo 10)
 * - Tokens JWT con expiración de 24 horas
 * - Mensajes de error genéricos para prevenir enumeración de usuarios
 * - Passwords nunca se retornan en las respuestas
 */
@Injectable()
export class AuthService {

    // ==========================================
    // CONSTRUCTOR - Inyección de Dependencias
    // ==========================================

    /**
     * Constructor del servicio
     * 
     * @param usersService - Servicio para manejar operaciones de usuarios
     * @param jwtService - Servicio para generar tokens JWT
     * 
     * Dependency Injection:
     * - NestJS inyecta automáticamente estas dependencias
     * - No necesitamos instanciarlas manualmente
     */
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    // ==========================================
    // MÉTODO: REGISTER - Registro de usuario
    // ==========================================

    /**
     * REGISTRO DE USUARIO
     * 
     * ALGORITMO:
     * 1. Verifica que el email no exista (prevenir duplicados)
     * 2. Verifica que el username no exista (prevenir duplicados)
     * 3. Hashea la contraseña usando bcrypt
     * 4. Crea el usuario en la base de datos
     * 5. Retorna usuario sin contraseña (seguridad)
     * 
     * @param registerDto - Datos del usuario a registrar (username, email, password)
     * @returns Objeto con mensaje de éxito y datos del usuario (sin password)
     * 
     * EXCEPCIONES:
     * - ConflictException (409): Si el email o username ya existe
     * 
     * EJEMPLO DE USO:
     * POST /auth/register
     * Body: { "username": "juan", "email": "juan@test.com", "password": "123456" }
     * Response: { "message": "...", "user": { "id": 1, "username": "juan", ... } }
     */
    async register(registerDto: RegisterDto) {

        // PASO 1: Extraer los datos del DTO
        // Desestructuramos para obtener username, email y password
        const { username, email, password } = registerDto;

        // PASO 2: Verificar si el email ya existe
        // usersService.findByEmail() retorna el usuario o undefined
        const existingUserByEmail = this.usersService.findByEmail(email);

        // Si existe un usuario con ese email, lanzar excepción
        if (existingUserByEmail) {
            // ConflictException genera respuesta HTTP 409 Conflict
            // Mensaje claro para el usuario sobre el problema
            throw new ConflictException('El email ya está registrado');
        }

        // PASO 3: Verificar si el username ya existe
        // Buscamos en todos los usuarios si alguno tiene ese username
        const existingUserByUsername = this.usersService.findAll()
            .find(user => user.username === username);

        // Si existe un usuario con ese username, lanzar excepción
        if (existingUserByUsername) {
            throw new ConflictException('El nombre de usuario ya está en uso');
        }

        // PASO 4: Hashear la contraseña
        // bcrypt.hash(password, saltRounds):
        // - password: La contraseña en texto plano del usuario
        // - saltRounds: Factor de costo (10 es estándar, más alto = más seguro pero más lento)
        // 
        // ¿Qué hace bcrypt?
        // 1. Genera un "salt" aleatorio (sal criptográfica)
        // 2. Combina el salt con la contraseña
        // 3. Aplica múltiples rondas de hashing (2^10 = 1024 rondas)
        // 4. Retorna un hash que incluye el salt
        //
        // Ejemplo:
        // Input:  "miPassword123"
        // Output: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
        //         └─┬─┘└┬┘└────────────┬────────────┘└───────────┬───────────┘
        //         Algo │      Salt (22 chars)          Hash (31 chars)
        //              │
        //           Cost Factor
        const hashedPassword = await bcrypt.hash(password, 10);

        // PASO 5: Crear el usuario en la base de datos
        // usersService.create() espera todos los campos excepto id y createdAt
        const newUser = this.usersService.create({
            username,                    // Nombre de usuario único
            email,                       // Email único
            password: hashedPassword,    // Contraseña HASHEADA (nunca en texto plano)
            isActive: true,              // Usuario activo por defecto
            updatedAt: new Date(),       // Fecha de última actualización
        });

        // PASO 6: Preparar respuesta (SIN contraseña)
        // Desestructuramos para separar password del resto de propiedades
        // SEGURIDAD: NUNCA retornamos el password, ni siquiera hasheado
        const { password: _, ...userWithoutPassword } = newUser;
        //         ↑ Usamos _ para indicar que descartamos esta variable

        // PASO 7: Retornar respuesta exitosa
        return {
            message: 'Usuario registrado exitosamente',
            user: userWithoutPassword,  // Usuario sin el campo password
        };

        // FLUJO COMPLETO DE EJEMPLO:
        // 
        // Cliente envía:
        // POST /auth/register
        // {
        //   "username": "juanperez",
        //   "email": "juan@test.com",
        //   "password": "miPassword123"
        // }
        //
        // Servidor responde:
        // Status: 201 Created
        // {
        //   "message": "Usuario registrado exitosamente",
        //   "user": {
        //     "id": 1,
        //     "username": "juanperez",
        //     "email": "juan@test.com",
        //     "isActive": true,
        //     "createdAt": "2024-01-15T10:30:00.000Z",
        //     "updatedAt": "2024-01-15T10:30:00.000Z"
        //   }
        // }
        //
        // En la base de datos se guarda:
        // {
        //   "id": 1,
        //   "username": "juanperez",
        //   "email": "juan@test.com",
        //   "password": "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZ...",  ← HASHEADA
        //   "isActive": true,
        //   "createdAt": "2024-01-15T10:30:00.000Z",
        //   "updatedAt": "2024-01-15T10:30:00.000Z"
        // }
    }

    // ==========================================
    // MÉTODO: LOGIN - Inicio de sesión
    // ==========================================

    /**
     * LOGIN DE USUARIO
     * 
     * ALGORITMO:
     * 1. Busca usuario por email
     * 2. Verifica que el usuario exista
     * 3. Verifica que el usuario esté activo
     * 4. Compara la contraseña con el hash almacenado
     * 5. Genera token JWT con información del usuario
     * 6. Retorna token y datos del usuario (sin password)
     * 
     * @param loginDto - Credenciales del usuario (email, password)
     * @returns Objeto con token JWT y datos del usuario
     * 
     * EXCEPCIONES:
     * - UnauthorizedException (401): Si las credenciales son inválidas
     * 
     * SEGURIDAD:
     * - Mensaje genérico en errores (no revelar si email existe o no)
     * - Previene enumeración de usuarios
     * - Verifica que el usuario esté activo antes de permitir login
     * 
     * EJEMPLO DE USO:
     * POST /auth/login
     * Body: { "email": "juan@test.com", "password": "miPassword123" }
     * Response: { "message": "Login exitoso", "access_token": "eyJ...", "user": {...} }
     */
    async login(loginDto: LoginDto) {

        // PASO 1: Extraer credenciales del DTO
        const { email, password } = loginDto;

        // PASO 2: Buscar usuario por email
        // findByEmail retorna User | undefined
        const user = this.usersService.findByEmail(email);

        // PASO 3: Verificar que el usuario exista
        // SEGURIDAD: Usamos mensaje genérico "Credenciales inválidas"
        // NO decimos "El email no existe" para prevenir enumeración de usuarios
        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // PASO 4: Verificar que el usuario esté activo
        // Si isActive es false, el usuario está suspendido/desactivado
        if (!user.isActive) {
            throw new UnauthorizedException('Usuario desactivado. Contacte al administrador.');
        }

        // PASO 5: Comparar contraseña con el hash
        // bcrypt.compare(plainPassword, hashedPassword):
        // - plainPassword: La contraseña que el usuario ingresó (texto plano)
        // - hashedPassword: El hash almacenado en la base de datos
        // 
        // ¿Cómo funciona?
        // 1. bcrypt extrae el salt del hash almacenado
        // 2. Aplica el mismo proceso de hash al password ingresado
        // 3. Compara el resultado con el hash almacenado
        // 4. Retorna true si coinciden, false si no
        //
        // Ejemplo:
        // Password ingresado: "miPassword123"
        // Hash almacenado:    "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZ..."
        // bcrypt.compare() → true (coinciden) o false (no coinciden)
        //
        // IMPORTANTE: Nunca comparar passwords con === 
        // ✗ INCORRECTO: password === user.password
        // ✓ CORRECTO:   await bcrypt.compare(password, user.password)
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // PASO 6: Verificar resultado de la comparación
        // Si las contraseñas no coinciden, lanzar excepción
        // SEGURIDAD: Mismo mensaje genérico que cuando el usuario no existe
        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // PASO 7: Generar token JWT
        // El payload es la información que se incluirá en el token
        // IMPORTANTE: No incluir información sensible (passwords, datos personales)
        const payload = {
            sub: user.id,           // "sub" (subject) es estándar JWT para el ID del usuario
            email: user.email,      // Email del usuario
            username: user.username // Nombre de usuario
        };

        // jwtService.sign(payload):
        // - Toma el payload y lo convierte en un token JWT
        // - Firma el token con la clave secreta (JWT_SECRET)
        // - El token tiene 3 partes: header.payload.signature
        // 
        // Estructura del token JWT:
        // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoianVhbkB0ZXN0LmNvbSIsImlhdCI6MTcwNTMxMjIwMCwiZXhwIjoxNzA1Mzk4NjAwfQ.signature
        // └──────────┬──────────┘ └────────────────────┬────────────────────┘ └────┬────┘
        //         Header                          Payload                    Signature
        //    (algoritmo: HS256)      (datos del usuario + timestamps)    (verificación)
        //
        // El payload decodificado contiene:
        // {
        //   "sub": 1,
        //   "email": "juan@test.com",
        //   "username": "juanperez",
        //   "iat": 1705312200,  ← Issued At (cuándo se creó)
        //   "exp": 1705398600   ← Expiration (cuándo expira, 24h después)
        // }
        const access_token = this.jwtService.sign(payload);

        // PASO 8: Preparar datos del usuario (sin password)
        const { password: _, ...userWithoutPassword } = user;

        // PASO 9: Retornar respuesta exitosa
        return {
            message: 'Login exitoso',
            access_token,               // Token JWT para autenticación
            user: userWithoutPassword,  // Datos del usuario sin password
        };

        // FLUJO COMPLETO DE EJEMPLO:
        //
        // Cliente envía:
        // POST /auth/login
        // {
        //   "email": "juan@test.com",
        //   "password": "miPassword123"
        // }
        //
        // Servidor:
        // 1. Busca usuario por email → Encontrado
        // 2. Verifica isActive → true
        // 3. bcrypt.compare("miPassword123", "$2b$10$...") → true
        // 4. Genera JWT con payload { sub: 1, email: "...", username: "..." }
        // 5. Retorna respuesta
        //
        // Respuesta:
        // Status: 201 Created (o 200 OK)
        // {
        //   "message": "Login exitoso",
        //   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        //   "user": {
        //     "id": 1,
        //     "username": "juanperez",
        //     "email": "juan@test.com",
        //     "isActive": true,
        //     "createdAt": "2024-01-15T10:30:00.000Z",
        //     "updatedAt": "2024-01-15T10:30:00.000Z"
        //   }
        // }
        //
        // Cliente guarda el token:
        // - En localStorage, sessionStorage, o cookies
        // - Para futuras peticiones a rutas protegidas
        // - Envía en header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
    }

    // ==========================================
    // MÉTODO: GET_PROFILE - Obtener perfil del usuario autenticado
    // ==========================================

    /**
     * OBTENER PERFIL
     * 
     * Retorna información completa del usuario autenticado
     * 
     * FLUJO:
     * 1. Recibe el userId del token JWT (extraído por JwtStrategy)
     * 2. Busca el usuario en la base de datos
     * 3. Verifica que el usuario exista
     * 4. Retorna datos del usuario sin contraseña
     * 
     * @param userId - ID del usuario (viene del token JWT decodificado)
     * @returns Datos del usuario sin contraseña
     * 
     * EXCEPCIONES:
     * - NotFoundException (404): Si el usuario no existe
     * 
     * USO:
     * - Este método se llama desde rutas protegidas con @UseGuards(JwtAuthGuard)
     * - El userId se obtiene de req.user.userId (inyectado por JwtStrategy)
     * 
     * EJEMPLO:
     * GET /auth/profile
     * Headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..." }
     * Response: { "id": 1, "username": "juan", "email": "juan@test.com", ... }
     */
    getProfile(userId: number) {

        // PASO 1: Buscar usuario por ID
        // findById retorna User | undefined
        const user = this.usersService.findById(userId);

        // PASO 2: Verificar que el usuario exista
        // Esto podría suceder si:
        // - El usuario fue eliminado después de generar el token
        // - El token es válido pero el usuario ya no existe
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // PASO 3: Remover contraseña de la respuesta
        // SEGURIDAD: Nunca exponer passwords, ni siquiera hasheados
        const { password, ...userWithoutPassword } = user;

        // PASO 4: Retornar datos del usuario
        return userWithoutPassword;

        // FLUJO COMPLETO DE EJEMPLO:
        //
        // Cliente hace petición con token:
        // GET /auth/profile
        // Headers: {
        //   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        // }
        //
        // Servidor (JwtAuthGuard + JwtStrategy):
        // 1. Extrae token del header
        // 2. Verifica firma con JWT_SECRET
        // 3. Decodifica payload → { sub: 1, email: "...", ... }
        // 4. Llama a JwtStrategy.validate(payload)
        // 5. JwtStrategy retorna { userId: 1, email: "...", ... }
        // 6. Datos disponibles en req.user
        //
        // Controlador:
        // 1. Obtiene userId de req.user.userId
        // 2. Llama a authService.getProfile(userId)
        //
        // AuthService.getProfile():
        // 1. Busca usuario con ID 1
        // 2. Usuario encontrado
        // 3. Remueve password
        // 4. Retorna datos
        //
        // Respuesta:
        // Status: 200 OK
        // {
        //   "id": 1,
        //   "username": "juanperez",
        //   "email": "juan@test.com",
        //   "isActive": true,
        //   "createdAt": "2024-01-15T10:30:00.000Z",
        //   "updatedAt": "2024-01-15T10:30:00.000Z"
        // }
    }

    // ==========================================
    // NOTAS ADICIONALES
    // ==========================================

    // MÉTODOS ADICIONALES QUE PODRÍAS IMPLEMENTAR:

    /**
     * Cambiar contraseña
     * 
     * async changePassword(userId: number, oldPassword: string, newPassword: string) {
     *   const user = this.usersService.findById(userId);
     *   if (!user) throw new NotFoundException('Usuario no encontrado');
     *   
     *   const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
     *   if (!isOldPasswordValid) throw new UnauthorizedException('Contraseña actual incorrecta');
     *   
     *   const hashedPassword = await bcrypt.hash(newPassword, 10);
     *   // Actualizar password en la base de datos
     *   
     *   return { message: 'Contraseña actualizada exitosamente' };
     * }
     */

    /**
     * Refrescar token (Refresh Token)
     * 
     * async refreshToken(refreshToken: string) {
     *   // Verificar refresh token
     *   // Generar nuevo access token
     *   // Retornar nuevo token
     * }
     */

    /**
     * Logout (con lista negra de tokens)
     * 
     * async logout(token: string) {
     *   // Agregar token a blacklist
     *   // Los tokens en blacklist no serán válidos aunque no hayan expirado
     * }
     */

    /**
     * Recuperación de contraseña
     * 
     * async forgotPassword(email: string) {
     *   // Generar token temporal
     *   // Enviar email con link de recuperación
     * }
     * 
     * async resetPassword(token: string, newPassword: string) {
     *   // Verificar token temporal
     *   // Actualizar contraseña
     * }
     */
}