/**
 * Entidad User (Usuario)
 * Representa a un usuario en el sistema.
 * Aunque en este taller usamos un array en memoria simulando una DB,
 * esta clase define la estructura de datos que tendría una tabla 'users'.
 */
export class User {
    /**
     * Identificador único del usuario (Primary Key).
     * - Tipo: number (entero)
     * - Características: Único, Autoincremental (gestionado por el servicio).
     * - Uso: Se usa para relacionar al usuario y buscarlo eficientemente.
     */
    id: number;

    /**
     * Nombre de usuario (username).
     * - Tipo: string (cadena de texto)
     * - Características: Obligatorio, Único.
     * - Uso: Para mostrar en la interfaz y como identificador alternativo.
     * - Ejemplo: "juanperez", "maria123"
     */
    username: string;

    /**
     * Correo electrónico del usuario.
     * - Tipo: string (cadena de texto)
     * - Características: Obligatorio, Único (Unique Key).
     * - Uso: Sirve como identificador principal para el inicio de sesión (Login).
     *   No dos usuarios pueden tener el mismo email.
     */
    email: string;

    /**
     * Contraseña del usuario.
     * - Tipo: string (cadena de texto)
     * - Características: Obligatorio.
     * - IMPORTANTE: Se almacena ENCRIPTADA (Hasheada) con bcrypt.
     *   NUNCA se debe guardar en texto plano por seguridad.
     */
    password: string;

    /**
     * Estado activo del usuario.
     * - Tipo: boolean
     * - Características: Obligatorio, valor por defecto: true.
     * - Uso: Permite desactivar usuarios sin eliminarlos.
     *   Si es false, el usuario no podrá iniciar sesión.
     */
    isActive: boolean;

    /**
     * Fecha de creación del registro.
     * - Tipo: Date (fecha y hora)
     * - Características: Obligatorio, valor por defecto: fecha actual.
     * - Uso: Auditoría para saber cuándo se registró el usuario.
     */
    createdAt: Date;

    /**
     * Fecha de última actualización del registro.
     * - Tipo: Date (fecha y hora)
     * - Características: Obligatorio.
     * - Uso: Auditoría para saber cuándo se modificó por última vez el usuario.
     */
    updatedAt: Date;
}