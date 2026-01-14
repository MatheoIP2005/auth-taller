// ============================================
// IMPORTACIONES
// ============================================

import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

// ============================================
// CONTROLADOR DE USUARIOS
// ============================================

// @Controller('users'): Define que este controlador manejará todas las rutas que empiecen con /users
@Controller('users')
export class UsersController {

  // Constructor: Inyectamos el UsersService usando Dependency Injection
  // - readonly: No podemos modificar esta propiedad después de la inicialización
  // - private: Solo accesible dentro de esta clase
  constructor(private readonly usersService: UsersService) { }

  // ==========================================
  // GET /users - Obtener todos los usuarios
  // ==========================================

  /**
   * Endpoint para obtener la lista de todos los usuarios
   * 
   * RUTA: GET http://localhost:3000/users
   * 
   * RESPUESTA: Array de usuarios sin contraseñas
   * Ejemplo:
   * [
   *   {
   *     "id": 1,
   *     "username": "juanperez",
   *     "email": "juan@test.com",
   *     "isActive": true,
   *     "createdAt": "2024-01-15T10:30:00.000Z",
   *     "updatedAt": "2024-01-15T10:30:00.000Z"
   *   }
   * ]
   * 
   * SEGURIDAD: Las contraseñas NO se incluyen en la respuesta
   */
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // ==========================================
  // GET /users/:id - Obtener un usuario por ID
  // ==========================================

  /**
   * Endpoint para obtener un usuario específico por su ID
   * 
   * RUTA: GET http://localhost:3000/users/1
   * 
   * PARÁMETRO:
   * - id: ID del usuario (viene en la URL)
   * 
   * @Param('id'): Extrae el parámetro 'id' de la URL
   * - id: string - NestJS siempre recibe los parámetros como string
   * - +id: El operador + convierte el string a número
   *   Ejemplo: +'123' → 123
   * 
   * RESPUESTA SI EXISTE:
   * {
   *   "id": 1,
   *   "username": "juanperez",
   *   "email": "juan@test.com",
   *   "password": "$2b$10$...",  // ⚠️ NOTA: Sí incluye password
   *   "isActive": true,
   *   "createdAt": "2024-01-15T10:30:00.000Z",
   *   "updatedAt": "2024-01-15T10:30:00.000Z"
   * }
   * 
   * RESPUESTA SI NO EXISTE:
   * undefined (Status 200 pero body vacío)
   * 
   * NOTA: Este endpoint SÍ retorna el password porque findById() retorna
   * el usuario completo. En un sistema real, deberías filtrar el password
   * antes de retornarlo.
   * 
   * MEJORA SUGERIDA:
   * Podrías modificar este método para no retornar el password:
   * 
   * @Get(':id')
   * findOne(@Param('id') id: string) {
   *   const user = this.usersService.findById(+id);
   *   if (!user) {
   *     throw new NotFoundException('Usuario no encontrado');
   *   }
   *   const { password, ...userWithoutPassword } = user;
   *   return userWithoutPassword;
   * }
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(+id);
  }

  // ==========================================
  // NOTAS SOBRE ENDPOINTS NO IMPLEMENTADOS
  // ==========================================

  // Los siguientes endpoints NO están implementados porque el UsersService
  // no tiene los métodos correspondientes:
  //
  // - POST /users - Crear usuario
  //   → Se crea en /auth/register en su lugar
  //
  // - PATCH /users/:id - Actualizar usuario
  //   → No implementado en este taller básico
  //   → Podrías agregarlo implementando el método update() en UsersService
  //
  // - DELETE /users/:id - Eliminar usuario
  //   → No implementado en este taller básico
  //   → Podrías agregarlo implementando el método remove() en UsersService

}
