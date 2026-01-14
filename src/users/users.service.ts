// ============================================
// IMPORTACIONES
// ============================================

// Injectable: Decorador que marca esta clase como un "proveedor" de NestJS
// Esto permite que NestJS la inyecte automáticamente en otros componentes
import { Injectable } from '@nestjs/common';

// User: Importamos la entidad User que define la estructura de un usuario
import { User } from './entities/user.entity';

// ============================================
// SERVICIO DE USUARIOS
// ============================================

// @Injectable() marca esta clase como un servicio que puede ser inyectado
@Injectable()
export class UsersService {

  // ==========================================
  // SIMULACIÓN DE BASE DE DATOS
  // ==========================================

  // private users: Arreglo privado que simula una tabla de base de datos
  // - En producción, esto sería reemplazado por TypeORM Repository
  // - Ejemplo: @InjectRepository(User) private userRepository: Repository<User>
  // - Usamos esto para el taller porque es más simple de entender
  private users: User[] = [];

  // idCounter: Contador para generar IDs únicos auto-incrementales
  // - Simula la funcionalidad de AUTO_INCREMENT de una base de datos
  // - En producción, la base de datos genera estos IDs automáticamente
  private idCounter = 1;

  // ==========================================
  // MÉTODO: CREATE - Crear nuevo usuario
  // ==========================================

  /**
   * Crea un nuevo usuario en el sistema
   * 
   * @param userData - Datos del usuario a crear (sin id ni createdAt)
   * @returns El usuario creado con todos sus campos
   * 
   * FLUJO:
   * 1. Recibe los datos del usuario (username, email, password, isActive, updatedAt)
   * 2. Genera un nuevo ID único usando el contador
   * 3. Crea el objeto completo del usuario con todos los campos
   * 4. Agrega el usuario al array (simula INSERT en base de datos)
   * 5. Retorna el usuario creado
   * 
   * NOTA: Este método NO hashea el password, eso se hace en AuthService
   * 
   * EJEMPLO DE USO:
   * const nuevoUsuario = this.usersService.create({
   *   username: 'juanperez',
   *   email: 'juan@test.com',
   *   password: '$2b$10$hashedPassword...', // Ya viene hasheado desde AuthService
   *   isActive: true,
   *   updatedAt: new Date()
   * });
   */
  create(userData: Omit<User, 'id' | 'createdAt'>): User {
    // Creamos un nuevo objeto User con todos los campos necesarios
    const newUser: User = {
      // id: Asignamos el ID actual del contador y luego lo incrementamos
      // El operador ++ incrementa después de asignar (post-incremento)
      id: this.idCounter++,

      // ...userData: Operador spread que copia todas las propiedades de userData
      // Esto incluye: username, email, password, isActive, updatedAt
      ...userData,

      // createdAt: Asignamos la fecha y hora actual automáticamente
      // new Date() crea un objeto Date con el momento exacto de creación
      createdAt: new Date(),
    };

    // Agregamos el nuevo usuario al array de usuarios
    // Esto simula: INSERT INTO usuarios (...) VALUES (...)
    this.users.push(newUser);

    // Retornamos el usuario creado con todos sus datos
    // Esto es útil para confirmar que se creó correctamente
    return newUser;
  }

  // ==========================================
  // MÉTODO: FIND_BY_EMAIL - Buscar usuario por email
  // ==========================================

  /**
   * Busca un usuario por su dirección de email
   * 
   * @param email - Email del usuario a buscar
   * @returns El usuario encontrado o undefined si no existe
   * 
   * USO PRINCIPAL: Este método es crucial para el LOGIN
   * - En el login, el usuario ingresa su email y password
   * - Usamos este método para verificar si el email existe
   * - Luego comparamos el password hasheado
   * 
   * NOTA: El método .find() recorre el array hasta encontrar el primer elemento
   * que cumpla la condición. Si no encuentra ninguno, retorna undefined
   * 
   * EJEMPLO DE USO EN LOGIN:
   * const usuario = this.usersService.findByEmail('juan@test.com');
   * if (!usuario) {
   *   throw new UnauthorizedException('Credenciales inválidas');
   * }
   * 
   * EN PRODUCCIÓN CON TYPEORM:
   * return this.userRepository.findOne({ where: { email } });
   */
  findByEmail(email: string): User | undefined {
    // .find() busca el primer usuario cuyo email coincida con el parámetro
    // user => user.email === email: Función flecha que compara cada usuario
    // Retorna el usuario encontrado o undefined si no existe
    return this.users.find(user => user.email === email);
  }

  // ==========================================
  // MÉTODO: FIND_BY_ID - Buscar usuario por ID
  // ==========================================

  /**
   * Busca un usuario por su ID único
   * 
   * @param id - ID numérico del usuario
   * @returns El usuario encontrado o undefined si no existe
   * 
   * USO PRINCIPAL: Este método es útil para:
   * 1. Obtener el perfil del usuario autenticado
   *    - El JWT contiene el ID del usuario (payload.sub)
   *    - Usamos este método para obtener los datos completos
   * 2. Validar que un usuario sigue existiendo
   *    - Antes de realizar operaciones, verificamos que el usuario existe
   * 
   * EJEMPLO DE USO EN PERFIL:
   * // Después de validar el JWT, tenemos el userId
   * const usuario = this.usersService.findById(userId);
   * if (!usuario) {
   *   throw new NotFoundException('Usuario no encontrado');
   * }
   * 
   * EN PRODUCCIÓN CON TYPEORM:
   * return this.userRepository.findOne({ where: { id } });
   */
  findById(id: number): User | undefined {
    // .find() busca el primer usuario cuyo id coincida con el parámetro
    // user => user.id === id: Función flecha que compara los IDs
    // Retorna el usuario encontrado o undefined si no existe
    return this.users.find(user => user.id === id);
  }

  // ==========================================
  // MÉTODO: FIND_ALL - Obtener todos los usuarios (SIN CONTRASEÑAS)
  // ==========================================

  /**
   * Obtiene una lista de todos los usuarios registrados
   * IMPORTANTE: NO incluye las contraseñas por seguridad
   * 
   * @returns Array de usuarios sin el campo password
   * 
   * SEGURIDAD: Nunca debemos exponer las contraseñas, ni siquiera hasheadas
   * - Las contraseñas hasheadas podrían ser objeto de ataques de fuerza bruta
   * - Aplicamos el principio de "mínima exposición de información"
   * 
   * IMPLEMENTACIÓN:
   * 1. Usamos .map() para transformar cada usuario
   * 2. Desestructuramos el usuario separando 'password' de las demás propiedades
   * 3. Retornamos solo las propiedades que no son password
   * 
   * EXPLICACIÓN DE LA DESESTRUCTURACIÓN:
   * const { password, ...rest } = user;
   *   - password: Extrae el campo password (lo descartamos)
   *   - ...rest: Operador rest que agrupa todas las demás propiedades
   *   - Ejemplo: Si user = { id: 1, email: 'a@b.com', password: 'hash' }
   *     → password = 'hash'
   *     → rest = { id: 1, email: 'a@b.com' }
   * 
   * EJEMPLO DE USO:
   * const usuarios = this.usersService.findAll();
   * // Retorna: [
   * //   { id: 1, username: 'juan', email: 'juan@test.com', isActive: true, ... },
   * //   { id: 2, username: 'maria', email: 'maria@test.com', isActive: true, ... }
   * // ]
   * 
   * EN PRODUCCIÓN CON TYPEORM:
   * return this.userRepository.find({
   *   select: ['id', 'username', 'email', 'isActive', 'createdAt', 'updatedAt']
   * });
   */
  findAll(): Omit<User, 'password'>[] {
    // .map() transforma cada elemento del array
    // Para cada usuario, eliminamos el campo password
    return this.users.map(({ password, ...rest }) => rest);

    // ALTERNATIVA MÁS EXPLÍCITA (mismo resultado):
    // return this.users.map(user => {
    //   const { password, ...userWithoutPassword } = user;
    //   return userWithoutPassword;
    // });
  }

  // ==========================================
  // NOTAS ADICIONALES
  // ==========================================

  // MÉTODOS QUE PODRÍAS AGREGAR EN EL FUTURO:

  /**
   * Actualizar un usuario existente
   * 
   * update(id: number, updateData: Partial<User>): User | undefined {
   *   const userIndex = this.users.findIndex(user => user.id === id);
   *   if (userIndex === -1) return undefined;
   *   
   *   this.users[userIndex] = {
   *     ...this.users[userIndex],
   *     ...updateData,
   *     updatedAt: new Date()
   *   };
   *   
   *   return this.users[userIndex];
   * }
   */

  /**
   * Desactivar un usuario (soft delete)
   * 
   * deactivate(id: number): User | undefined {
   *   const user = this.findById(id);
   *   if (!user) return undefined;
   *   
   *   user.isActive = false;
   *   user.updatedAt = new Date();
   *   
   *   return user;
   * }
   */

  /**
   * Eliminar un usuario permanentemente (hard delete)
   * 
   * remove(id: number): boolean {
   *   const userIndex = this.users.findIndex(user => user.id === id);
   *   if (userIndex === -1) return false;
   *   
   *   this.users.splice(userIndex, 1);
   *   return true;
   * }
   */

  /**
   * Buscar usuario por username
   * 
   * findByUsername(username: string): User | undefined {
   *   return this.users.find(user => user.username === username);
   * }
   */
}