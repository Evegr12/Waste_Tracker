const dotenv = require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { Op } = require('sequelize');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs'); //'fs' sistema de archivos
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');  
const { error } = require('console');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
app.use(cors());
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const jwt_decode = require('jwt-decode');

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../htmls')));
app.use(express.static(path.join(__dirname, '../images')));
app.use(express.static(path.join(__dirname, '../styles')));
app.use(express.static(path.join(__dirname, '../js')));
const uploadDir = path.join(__dirname, '../uploads'); // Define la ruta de la carpeta 'uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir); // Crea la carpeta si no existe
}

// Configuración de almacenamiento de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Usa la ruta definida anteriormente
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`); // Nombre único del archivo
  }
});

const upload = multer({ storage: storage });

// Configurar socket.io con el servidor HTTP
const io = new Server(server, {
  cors: {
    origin: '*', // Permitir conexiones desde cualquier origen
    methods: ['GET', 'POST']
  }
});
// Configuración de CORS
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PATCH'],
  credentials: true
};

app.use(express.static(path.join(__dirname, '../')));
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(session({
  secret: 'Dellevesecret', // Clave secreta
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true } //true si se está usando HTTPS
}));

// Configuración del cliente de conexión a la base de datos con Sequelize
const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.MYSQL_HOST,
  username: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB
});

async function connect() {
  try {
    await sequelize.authenticate();
    console.log("Conectado a la BD.");
  } catch (e) {
    console.error("No se puede conectar a la BD.");
    console.error(e);
    process.exit(1);
  }
}

connect();

const Usuario = sequelize.define('usuarios', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  usuario: {
    type: DataTypes.STRING(45),
    allowNull: false,
    unique: false
  },
  contrasenia: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  tipo_usuario: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  fotoPerfil: {
    type: DataTypes.STRING, //Aquí se almacenará la URL de la imagen
    allowNull: true,
  }
}, {
  tableName: 'usuarios',
  timestamps: false
});

const Restaurante = sequelize.define('restaurantes', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  usuarios_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id'
    }
  },
  nombre: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
}, {
  tableName: 'restaurantes',
  timestamps: false
});
const Recolector = sequelize.define('recolectores', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  usuarios_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id'
    }
  }
}, {
  tableName: 'recolectores',
  timestamps: false
});
const Recoleccion = sequelize.define('recolecciones', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  restaurantes_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Restaurante,
      key: 'id'
    }
  },
  recolectores_id: {
    type: DataTypes.INTEGER,
    allowNull: true, //de inicio se registra como nulo, pero al ser aceptada la solicitud, se le asigna el id del recolector
    references: {
      model: Recolector,
      key: 'id'
    }
  },
  fecha_solicitud: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_recoleccion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  calificacion: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  comentario: {
    type: DataTypes.STRING(255), // Campo para almacenar el comentario del restaurante
    allowNull: true // El comentario es opcional
  },
  estado: {
    type: DataTypes.STRING,
    defaultValue: 'pendiente',  // Estado: 'pendiente', 'en proceso', 'en camino', 'llegada', 'finalizada'
    allowNull: false
  }
}, {
  tableName: 'recolecciones',
  timestamps: false
});
const NotificacionConsejo = sequelize.define('notificaciones_consejos', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  texto: {
    type: DataTypes.STRING(150),
    allowNull: false
  }
}, {
  tableName: 'notificaciones_consejos',
  timestamps: false
});

const Notificacion = sequelize.define('notificaciones', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  usuarios_id:{
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id'
    }
  },
  mensaje: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: () => new Date()
  }
}, {
  tableName: 'notificaciones',
  timestamps: false
});

// Relaciones
// Relación entre Usuario y Restaurante
Usuario.hasOne(Restaurante, { foreignKey: 'usuarios_id' });
Restaurante.belongsTo(Usuario, { foreignKey: 'usuarios_id' });

// Relación entre Usuario y Recolector
Usuario.hasOne(Recolector, { foreignKey: 'usuarios_id' });
Recolector.belongsTo(Usuario, { foreignKey: 'usuarios_id' });

// Relación entre Restaurante y Recolección
Restaurante.hasMany(Recoleccion, { foreignKey: 'restaurantes_id' });
Recoleccion.belongsTo(Restaurante, { foreignKey: 'restaurantes_id' });

// Relación entre Recolector y Recolección
Recolector.hasMany(Recoleccion, { foreignKey: 'recolectores_id' });
Recoleccion.belongsTo(Recolector, { foreignKey: 'recolectores_id' });

// Relación entre Notificacion y Usuario
Notificacion.belongsTo(Usuario, { foreignKey: 'usuarios_id' });
Usuario.hasMany(Notificacion, { foreignKey: 'usuarios_id' });


// Sincronizar la base de datos
async function sync() {
  try {
    await sequelize.sync({ force: false}); // No eliminar las tablas en cada sincronización
    sequelize.sync({ alter: true });
    console.log("Base de datos sincronizada.");
  } catch (e) {
    console.error("La BD no se pudo actualizar.");
    console.error(e);
  }
}
sync();

const usuariosConectados = new Map(); 

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  //Registrar al usuario
  socket.on('registrarUsuario', (usuarioId) => {
    usuariosConectados.set(usuarioId, socket.id);
    console.log(`Usuario con ID ${usuarioId} registrado con socket: ${socket.id}`);
  });

  socket.on('nuevaNotificacion', (data) => {
    io.emit('notificacionUsuario', data); // Emite la notificación a todos los usuarios conectados
  });

  socket.on('nuevaSolicitud', (solicitud) => {
      io.emit('nuevaSolicitud', solicitud); // Emite la nueva solicitud para mostrarla en los mapas
  });

  socket.on('aceptarSolicitud', (solicitudId) => {
    io.emit('solicitudAceptada', { solicitudId });
    console.log(`Solicitud con ID ${solicitudId} ha sido aceptada`);
  });

  // Escuchar evento del cliente para obtener el historial de recolecciones
  socket.on('obtenerHistorialRecolecciones', async ({ restaurantesId }) => {

    try {
        const recolecciones = await Recoleccion.findAll({
            where: {
                restaurantes_id: restaurantesId,
                estado: 'finalizada'
            },
            attributes: ['fecha_recoleccion'], // fecha finalización
            include: {
                model: Recolector,
                include: {
                    model: Usuario,
                    attributes: ['nombre']
                }
            }
        });

        // Emitir el historial al cliente que lo solicitó
        socket.emit('historialRecolecciones', {
            success: true,
            recolecciones
        });
    } catch (error) {
        console.error('Error al obtener el historial de recolecciones:', error);
        socket.emit('historialRecolecciones', {
            success: false,
            message: 'Error al obtener el historial de recolecciones.'
        });
    }
});

  // Manejar la desconexión del cliente
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const TokenRevocado = sequelize.define('token_revocados', {
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  }
}, {
  tableName: 'token_revocados',
  timestamps: true // Esto agregará columnas createdAt y updatedAt
});

// Función para generar tokens JWT
function generarToken(usuario) {
  return jwt.sign({
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    tipo_usuario: usuario.tipo_usuario
  }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

// Middleware para verificar el token JWT desde la cookie
function verificarToken(req, res, next) {
  const token = req.cookies.jwt; // Obtener el token de la cookie

  console.log('Token recibido desde cookie:', token); // Añadido para depuración

  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
          if (err.name === 'TokenExpiredError') {
              return res.status(403).json({ error: 'Token expirado. Por favor, inicia sesión nuevamente.' });
          }
          console.error('Error al verificar el token:', err);
          return res.status(403).json({ error: 'Token inválido' });
      }
      req.user = user; // Almacenar los datos del usuario en la solicitud
      console.log('Usuario verificado:', user); // Añadido para depuración
      next(); // Continuar con la solicitud
  });
}

// Ruta para login
app.post('/login', async (req, res) => {
  const { correo, contrasenia } = req.body;

  try {
    // Buscar el usuario en la base de datos
    let query = `SELECT * FROM usuarios WHERE correo = ? OR usuario = ?`;
    let results = await sequelize.query(query, { replacements: [correo, correo], type: sequelize.QueryTypes.SELECT });

    if (results && results.length > 0) {
      const user = results[0];
      const match = await bcrypt.compare(contrasenia, user.contrasenia); // Verificar contraseña
      if (!match) {
        return res.status(401).json({ error: 'Correo electrónico/usuario o contraseña incorrectos' });
      }

      const restaurante = await Restaurante.findOne({ where: { usuarios_id: user.id } });
      const recolector = await Recolector.findOne({ where: { usuarios_id: user.id } }); // Buscar recolector asociado

      // Generar el token JWT
      const token = jwt.sign({
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        tipo_usuario: user.tipo_usuario
      }, process.env.JWT_SECRET, { expiresIn: '1d' });  // El token expira en 1 día

      // Almacenar el token en una cookie HTTP-only
      res.cookie('jwt', token, {
        httpOnly: false,  // La cookie no será accesible mediante JavaScript
        secure: process.env.NODE_ENV === 'production',  // Solo en HTTPS en producción
        maxAge: 24 * 60 * 60 * 1000  // La cookie expira en 1 día
      });

      // Respuesta con los datos del usuario (sin el token)
      res.json({
        id: user.id,
        tipo_usuario: user.tipo_usuario,
        restaurantes_id: restaurante ? restaurante.id : null,
        recolector_id: recolector ? recolector.id : null,  // Incluir recolector_id si es recolector
        nombreRecolector: recolector ? user.nombre : null,  //nombre del recolector
        nombreRestaurante: restaurante ? restaurante.nombre : null,  //nombre del restaurante
        direccion: restaurante ? restaurante.direccion : null,  // dirección del restaurante
        fotoPerfil: user.fotoPerfil
      });
    } else {
      res.status(401).json({ error: 'Correo/usuario o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error al iniciar sesión', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta raíz, devuelve el archivo HTML principal
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../htmls/login.html'));
});

app.get('/inicioRestaurante', function (req, res) {
  res.sendFile(path.join(__dirname, '../htmls/inicioRestaurante.html'));
});

app.get('/inicioRecolector', function (req, res) {
  res.sendFile(path.join(__dirname, '../htmls/inicioRecolector.html'));
});

// Ruta para registro de restaurante
app.post('/registroRestaurante', upload.none(), async (req, res) => {
  const { usuario, nombre, correo, nombre_restaurante, direccion, contrasenia } = req.body;

  if (!usuario || !nombre || !correo || !nombre_restaurante || !direccion || !contrasenia) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    // Obtener coordenadas usando Mapbox antes de guardar la dirección
    const coordenadas = await obtenerCoordenadas(direccion);
    
    if (!coordenadas.lat || !coordenadas.lon) {
      return res.status(400).send('No se pudieron obtener las coordenadas para la dirección proporcionada');
    }

    await sequelize.transaction(async (t) => {
      const newUser = await Usuario.create({
        usuario,
        nombre,
        correo,
        contrasenia: hashedPassword,
        tipo_usuario: 'restaurante',
      }, { transaction: t });

      await Restaurante.create({
        nombre: nombre_restaurante,
        direccion,
        latitud: coordenadas.lat, // Guardar latitud
        longitud: coordenadas.lon, // Guardar longitud
        usuarios_id: newUser.id
      }, { transaction: t });
    });

    res.status(200).json({ message: 'Registro exitoso' });
  } catch (error) {
    console.error('Error al registrar usuario restaurante', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para registro de recolectores
app.post('/registroRecolector', upload.none(), async (req, res) => {
  console.time('RegistroRecolector'); 
  const { usuario, nombre, correo, contrasenia } = req.body;
  if (!usuario || !nombre || !correo || !contrasenia) {
    return res.status(400).send('Todos los campos son requeridos');
  }
  try {
    const hashedPassword = await bcrypt.hash(contrasenia, 10);
    await sequelize.transaction(async (t) => {
      const newUser = await Usuario.create({
        usuario,
        nombre,
        correo,
        contrasenia: hashedPassword,
        tipo_usuario: 'recolector',
      }, { transaction: t });

      await Recolector.create({
        usuarios_id: newUser.id
      }, { transaction: t });
    });

    console.timeEnd('RegistroRecolector'); // Finaliza el tiempo de ejecución
    res.json({message: 'registro exitoso!'});
  } catch (error) {
    console.error('Error al registrar usuario recolector', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.post('/upload-photo', upload.single('fotoPerfil'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subió ningún archivo.' });
    }

    const imageUrl = `../uploads/${req.file.filename}`;
    const userId = req.body.usuarios_id;

    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    usuario.fotoPerfil = imageUrl;
    await usuario.save();

    // Emitir la nueva URL de imagen al cliente
    io.to(req.socketId).emit('actualizarFotoPerfil', { imageUrl });

    // Respuesta en JSON para compatibilidad
    res.json({ success: true, message: 'Foto de perfil subida con éxito.', imageUrl });
  } catch (error) {
    console.error('Error al guardar la URL de la imagen en la base de datos:', error);
    res.status(500).json({ success: false, message: 'Error al guardar la imagen.' });
  }
});

// Servir las imágenes estáticas desde la carpeta 'uploads'
app.use('/uploads', express.static(uploadDir));

async function obtenerCoordenadas(direccion) {
  const apiKey = 'pk.eyJ1IjoiZXZlZWwxMiIsImEiOiJjbTA3MGk4MzkwOThhMmtweWR6bXIzN243In0.383L_pn-MRKDck06J7jktw'; // Token API de Mapbox
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(direccion)}.json?access_token=${apiKey}&country=MX&limit=1`;

  if (!direccion) {
      console.error("La dirección es undefined o vacía. No se pueden obtener coordenadas.");
      return { lat: null, lon: null };
  }

  console.log(`Obteniendo coordenadas para la dirección: ${direccion}`);

  try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
          const { center } = data.features[0]; // center es un array [lon, lat]
          const [lon, lat] = center;
          console.log(`Coordenadas obtenidas para ${direccion}: lat=${lat}, lon=${lon}`);
          return { lat, lon };
      } else {
          console.error("No se encontraron coordenadas para la dirección.");
          return { lat: null, lon: null };
      }
  } catch (error) {
      console.error("Error al obtener coordenadas:", error);
      return { lat: null, lon: null };
  }
}

app.get('/restaurante-info', verificarToken, async (req, res) => {
  try {
      const usuario = await Usuario.findByPk(req.user.id, {
          include: [{ model: Restaurante }] // Asegúrate de que la relación esté bien definida
      });

      if (!usuario || !usuario.restaurante) {
          return res.status(404).json({ error: 'Restaurante no encontrado para este usuario' });
      }

      res.json({
          id: usuario.restaurante.id,
          nombre: usuario.restaurante.nombre,
          direccion: usuario.restaurante.direccion,
          // Otros campos que desees incluir
      });
  } catch (error) {
      console.error('Error al obtener la información del restaurante:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/solicitud-actual/:restaurantes_id', async (req, res) => {
  const { restaurantes_id } = req.params;

  try {
    const solicitudPendiente = await Recoleccion.findOne({
      where: {
        restaurantes_id: restaurantes_id,
        [Op.or]: [
          { estado: 'pendiente' },
          { estado: 'en proceso' },
          { estado: 'en camino' },
          { estado: 'llegada' }
        ]
      }
    });

    if (solicitudPendiente) {
      // Si hay una solicitud pendiente
      return res.json({ tieneSolicitudPendiente: true });
    } else {
      // Si no hay solicitud pendiente
      return res.json({ tieneSolicitudPendiente: false });
    }
  } catch (error) {
    console.error('Error al buscar la solicitud:', error);
    return res.status(500).json({ 
      error: 'Error del servidor al buscar la solicitud',
      detalles: error.message // Esto puede dar más información sobre el error
    });
  }
});

app.post('/solicitar-recoleccion', verificarToken, async (req, res) => { 
  console.log("Datos recibidos en la solicitud:", req.body);
  const { direccion, restaurantes_id } = req.body;
  console.log("Dirección recibida:", direccion);

  try {
    // Obtener coordenadas de la dirección proporcionada
    const coordenadas = await obtenerCoordenadas(direccion);

    if (coordenadas.lat === null || coordenadas.lon === null) {
      console.error("Coordenadas no disponibles para la dirección proporcionada.");
      return res.status(400).json({ error: 'No se pudieron obtener coordenadas para la dirección proporcionada.' });
    }

    console.log("Coordenadas obtenidas:", coordenadas);

    // Actualizar la ubicación del restaurante en la base de datos
    await Restaurante.update(
      { latitude: coordenadas.lat, longitude: coordenadas.lon },
      { where: { id: restaurantes_id } }
    );

    // Crear una nueva solicitud de recolección
    const recoleccion = await Recoleccion.create({
      restaurantes_id: restaurantes_id,
      fecha_solicitud: new Date(),
      estado: 'pendiente'
    });

    // Obtener detalles del restaurante para notificar a los recolectores
    const restaurante = await Restaurante.findOne({
      where: { id: restaurantes_id },
      attributes: ['nombre', 'direccion', 'latitude', 'longitude']
    });

    // Notificar a los recolectores sobre la nueva solicitud
    await notificarRecolectores();

    // Notificar al restaurante que su solicitud fue enviada y está pendiente
    await notificarRestaurante(restaurantes_id);

    // Emitir un evento para actualizar el mapa de los recolectores en tiempo real
    io.emit('actualizarMapa', {
      solicitudId: recoleccion.id,
      nombre: restaurante.nombre,
      direccion: restaurante.direccion,
      latitude: coordenadas.lat,
      longitude: coordenadas.lon,
      estado: 'pendiente'
    });
    
    console.log("Solicitud de recolección enviada correctamente.");

    // Enviar una respuesta exitosa al cliente
    res.json({ message: '¡Solicitud enviada exitosamente!' });

  } catch (error) {
    console.error('Error al guardar la solicitud de recolección:', error);
    res.status(500).json({ error: 'Error al enviar la solicitud de recolección' });
  }
});

// Función para notificar a los recolectores
async function notificarRecolectores() {
  try {
    const recolectores = await Recolector.findAll();
    recolectores.forEach(async (recolector) => {
      const socketIdRecolector = usuariosConectados.get(recolector.usuarios_id);
      const mensaje = 'Hay una nueva solicitud de recolección.';
      
      // Inserta la notificación en la base de datos
      await Notificacion.create({
        mensaje: mensaje,
        leida: false,
        fecha: new Date(),
        usuarios_id: recolector.usuarios_id
      });
      
      if (socketIdRecolector) {
        io.to(socketIdRecolector).emit('notificacionUsuario', {
          mensaje: mensaje,
          fecha: new Date().toISOString(),
        });
      }
    });
  } catch (notificationError) {
    console.error('Error al enviar notificaciones a recolectores:', notificationError);
  }
}

// Función para notificar al restaurante
async function notificarRestaurante(restaurantes_id) {
  try {
    const restaurante = await Restaurante.findByPk(restaurantes_id);
    const mensaje = 'Tu solicitud de recolección ha sido enviada. Espera a que sea aceptada.';
    
    // Inserta la notificación en la base de datos
    await Notificacion.create({
      mensaje: mensaje,
      leida: false,
      fecha: new Date(),
      usuarios_id: restaurante.usuarios_id // Asegúrate de que este campo sea correcto
    });

    const socketIdRestaurante = usuariosConectados.get(restaurante.usuarios_id);
    if (socketIdRestaurante) {
      io.to(socketIdRestaurante).emit('notificacionUsuario', {
        mensaje: mensaje,
        fecha: new Date().toISOString(),
      });
    }
  } catch (notificationError) {
    console.error('Error al enviar notificación al restaurante:', notificationError);
  }
}

// Ruta para obtener solicitudes de recolección pendientes
app.get('/solicitudes-pendientes', async (req, res) => {
  try {
    const solicitudesPendientes = await Recoleccion.findAll({
      where: {
        estado: 'pendiente',
      },
      include: [{
        model: Restaurante,
        attributes: ['nombre', 'latitude', 'longitude', 'direccion'], // Incluye 'nombre'
      }],
    });

    if (solicitudesPendientes.length === 0) {
      return res.status(404).json({ message: 'No hay solicitudes pendientes' });
    }

    res.json(solicitudesPendientes);
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener las solicitudes pendientes' });
  }
});

// Middleware para verificar si el usuario es recolector
async function verificarRecolector(req, res, next) {
  const recolectorId = req.user.id; // Obtener ID del recolector del token

  try {
      const recolector = await Recolector.findOne({ where: { usuarios_id: recolectorId } });
      if (!recolector) {
          return res.status(403).json({ error: 'No autorizado como recolector' });
      }
      req.recolector = recolector;
      next();
  } catch (error) {
      console.error('Error al verificar el recolector:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Ruta para aceptar recolecciones
app.post('/aceptar-recolecciones', verificarToken, verificarRecolector, async (req, res) => {

  const { recoleccion_id } = req.body;

  // Verificar que el recoleccion_id esté presente
  if (!recoleccion_id) {
      return res.status(400).json({ error: 'El ID de recolección es requerido' });
  }

  const recolectorId = req.recolector.id; // Obtener el ID del recolector desde req.recolector
  if (!recolectorId) {
      return res.status(401).json({ error: 'No autorizado' });
  }

  try {
      // Buscar la recolección que esté en estado "pendiente" por su ID
      const recoleccion = await Recoleccion.findOne({
          where: {
              id: recoleccion_id,
              estado: 'pendiente'
          }
      });

      if (!recoleccion) {
          return res.status(404).json({ error: 'No se encontró una solicitud pendiente con el ID proporcionado' });
      }

      // Actualizar el estado de la recolección y asignar el recolector
      await recoleccion.update({
          estado: 'en proceso',
          recolectores_id: recolectorId
      });

      // Función para obtener el usuarioId asociado a un restauranteId
      async function obtenerUsuarioIdDeRestaurante(restauranteId) {
        try {
          const restaurante = await Restaurante.findOne({
            where: { id: restauranteId },
            attributes: ['usuarios_id'] // Asegura que esta columna exista en tu modelo
          });

          return restaurante ? restaurante.usuarios_id : null;
        } catch (error) {
          console.error('Error al obtener usuarioId de restaurante:', error);
          throw error;
        }
      }

      // Función para obtener el usuarioId asociado a un recolectorId
      async function obtenerUsuarioIdDeRecolector(recolectorId) {
        try {
          const recolector = await Recolector.findOne({
            where: { id: recolectorId },
            attributes: ['usuarios_id'] // Asegura que esta columna exista en tu modelo
          });

          return recolector ? recolector.usuarios_id : null;
        } catch (error) {
          console.error('Error al obtener usuarioId de recolector:', error);
          throw error;
        }
      }

      // Enviar notificaciones
      const restauranteId = recoleccion.restaurantes_id;
      const usuarioIdRestaurante = await obtenerUsuarioIdDeRestaurante(restauranteId);
      const usuarioIdRecolector = await obtenerUsuarioIdDeRecolector(recolectorId);

      // Enviar notificación a restaurante y recolector
      await enviarNotificacion(usuarioIdRestaurante, 'Tu solicitud ha sido aceptada');
      await enviarNotificacion(usuarioIdRecolector, 'Muy bien! Has aceptado recolectar');

      // Emitir notificaciones en tiempo real con Socket.IO
      io.emit('enviarNotificacion', {
          usuarioId: usuarioIdRestaurante,
          mensaje: "Tu solicitud ha sido aceptada",
          fecha: new Date().toISOString()
      });

      io.emit('enviarNotificacion', {
          usuarioId: usuarioIdRecolector,
          mensaje: "Muy bien! Has aceptado recolectar",
          fecha: new Date().toISOString()
      });
      io.emit('solicitudAceptada', { solicitudId: req.body.recoleccion_id, estado: 'en proceso' });
      res.json({ message: 'Solicitud aceptada y ahora está en proceso' });
  } catch (error) {
      console.error('Error al aceptar la recolección:', error);
      res.status(500).json({ error: 'Error al aceptar la recolección' });
  }
});

async function enviarNotificacion(usuarioId, mensaje) {
  try {
    // Inserta la notificación en la base de datos
    await Notificacion.create({
      mensaje: mensaje,
      leida: false,
      fecha: new Date(),
      usuarios_id: usuarioId
    });

    // Obtener el ID del socket del usuario conectado
    const socketIdUsuario = usuariosConectados.get(usuarioId);
    if (socketIdUsuario) {
      io.to(socketIdUsuario).emit('notificacionUsuario', {
        mensaje: mensaje,
        fecha: new Date().toISOString(),
      });
    }
  } catch (notificationError) {
    console.error('Error al enviar notificación:', notificationError);
  }
}

// Ruta solicitudes aceptadas por el recolector
app.get('/solicitudes-aceptadas', verificarToken, verificarRecolector, async (req, res) => {
  try {
    console.log('Recolector autenticado:', req.recolector);

    const solicitudesAceptadas = await Recoleccion.findAll({
      where: {
        recolectores_id: req.recolector.id,
        // Incluye solicitudes con estado 'en proceso' y 'en camino'
        [Op.or]: [
          { estado: 'en proceso' },
          { estado: 'en camino' },
          {estado: 'llegada'}
        ]
      },
      include: [{
        model: Restaurante,
        attributes: ['nombre', 'latitude', 'longitude', 'direccion'],  // Incluye el nombre del restaurante
      }],
    });    

    if (solicitudesAceptadas.length === 0) {
      return res.status(404).json({ message: 'No hay solicitudes aceptadas' });
    }

    res.json(solicitudesAceptadas);
  } catch (error) {
    console.error('Error al obtener solicitudes aceptadas:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener las solicitudes aceptadas' });
  }
});


// Endpoint para actualizar el estado de una solicitud
app.patch('/update-status/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { status, eta } = req.body; // Recibe la ETA si está disponible
  let mensajeRestaurante;

  try {
    const recoleccion = await Recoleccion.findByPk(id);

    if (!recoleccion) {
      return res.status(404).json({ error: 'Recolección no encontrada' });
    }

    // Actualizar el estado de la recolección
    recoleccion.estado = status;

    // Si el estado es "finalizada", registrar la hora actual en fecha_recoleccion
    if (status === 'finalizada') {
      recoleccion.fecha_recoleccion = new Date(); // Registra la fecha y hora de finalización
    }

    await recoleccion.save();

    // Función para obtener el usuarioId asociado a un restauranteId
    async function obtenerUsuarioIdDeRestaurante(restauranteId) {
      const restaurante = await Restaurante.findOne({
        where: { id: restauranteId },
        attributes: ['usuarios_id']
      });
      return restaurante ? restaurante.usuarios_id : null;
    }

    // Función para obtener el usuarioId asociado a un recolectorId
    async function obtenerUsuarioIdDeRecolector(recolectorId) {
      const recolector = await Recolector.findOne({
        where: { id: recolectorId },
        attributes: ['usuarios_id']
      });
      return recolector ? recolector.usuarios_id : null;
    }

    // Obtener los IDs de usuario del recolector y del restaurante
    const usuarioIdRestaurante = await obtenerUsuarioIdDeRestaurante(recoleccion.restaurantes_id);
    const usuarioIdRecolector = await obtenerUsuarioIdDeRecolector(recoleccion.recolectores_id);

    // Configura los mensajes de notificación para cada estado
    const mensajesNotificacion = {
      'pendiente': {
        recolector: 'Se ha cancelado una recolección',
        restaurante: 'Tu solicitud ha sido cancelada, espera a que otro recolector la acepte'
      },
      'en camino': {
        recolector: 'Vas en camino a la recolección, suerte en tu viaje!',
        restaurante: `El recolector está en camino, hora estimada de llegada: ${eta}`
      },
      'llegada': {
        recolector: 'Llegaste al destino de recolección, asegúrate de brindar un buen servicio',
        restaurante: 'El recolector ha llegado a tu restaurante!'
      },
      'finalizada': {
        recolector: 'Recolección finalizada con éxito',
        restaurante: 'La recolección ha sido completada, ya puedes calificar el servicio'
      }
    };

    // Envía notificación al recolector
    if (usuarioIdRecolector) {
      await enviarNotificacion(usuarioIdRecolector, mensajesNotificacion[status].recolector);
    }

    // Envía notificación al restaurante
    if (usuarioIdRestaurante) {
      mensajeRestaurante = mensajesNotificacion[status].restaurante;
      await enviarNotificacion(usuarioIdRestaurante, mensajeRestaurante);
    }

    // Emitir evento para actualizar el mapa en tiempo real
    io.emit('actualizarMapa', { solicitudId: id, estado: status, eta });
    console.log(`Evento actualizarMapa emitido para solicitud ID: ${id}, Estado: ${status}`);
  
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar el estado:', error);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
});

// Función para enviar notificación al usuario específico
async function enviarNotificacion(usuarioId, mensaje) {
  try {
    await Notificacion.create({
      mensaje: mensaje,
      leida: false,
      fecha: new Date(),
      usuarios_id: usuarioId
    });

    const socketIdUsuario = usuariosConectados.get(usuarioId);
    if (socketIdUsuario) {
      io.to(socketIdUsuario).emit('notificacionUsuario', {
        mensaje: mensaje,
        fecha: new Date().toISOString()
      });
    }
  } catch (notificationError) {
    console.error('Error al enviar notificación:', notificationError);
  }
}

app.get('/historial-recolecciones/:restaurantesId', async (req, res) => {
  const { restaurantesId } = req.params;

  try {
      const recolecciones = await Recoleccion.findAll({
          where: {
              restaurantes_id: restaurantesId,
              estado: 'finalizada'
          },
          attributes: ['fecha_recoleccion'], //fecha finalizacion
          include: {
              model: Recolector,
              include: {
                  model: Usuario,
                  attributes: ['nombre']
              }
          }
      });

      res.json({
          success: true,
          recolecciones
      });
  } catch (error) {
      console.error('Error al obtener el historial de recolecciones:', error);
      res.status(500).json({
          success: false,
          message: 'Error al obtener el historial de recolecciones.'
      });
  }
});

// Endpoint para obtener la última recolección finalizada
/*app.get('/recolecciones/ultima-finalizada/:restauranteId', verificarToken, async (req, res) => {
  const { restauranteId } = req.params;

  try {
    const recoleccion = await Recoleccion.findOne({
      where: {
        restaurantes_id: restauranteId,
        estado: 'finalizada',
        calificacion: null // Filtrar por recolecciones sin calificación
      },
      order: [['fecha_solicitud', 'DESC']], // Ordenar por fecha de solicitud de manera descendente
      include: [
        {
          model: Recolector,
          attributes: ['id'],
          include: [{
            model: Usuario,
            attributes: ['nombre']
          }]
        }
      ]
    });

    if (!recoleccion) {
      return res.status(404).json({ message: 'No hay recolecciones finalizadas sin calificar' });
    }

    res.json({ recoleccion }); // Asegúrate de devolver un objeto con la propiedad `recoleccion`
  } catch (error) {
    console.error('Error al obtener la última recolección finalizada:', error);
    res.status(500).json({ error: 'Error al obtener la última recolección finalizada' });
  }
});*/

// Evento para obtener la última recolección sin calificar
io.on('connection', (socket) => {
  socket.on('obtenerUltimaRecoleccionSinCalificar', async ({ restauranteId }) => {
    try {
      const recoleccion = await Recoleccion.findOne({
        where: {
          restaurantes_id: restauranteId,
          estado: 'finalizada',
          calificacion: null // Filtrar por recolecciones sin calificación
        },
        order: [['fecha_solicitud', 'DESC']],
        include: [
          {
            model: Recolector,
            attributes: ['id'],
            include: [{
              model: Usuario,
              attributes: ['nombre']
            }]
          }
        ]
      });

      if (!recoleccion) {
        // Emitir un mensaje de que no hay recolecciones sin calificar
        socket.emit('ultimaRecoleccionSinCalificar', { message: 'No hay recolecciones finalizadas sin calificar' });
      } else {
        // Emitir la última recolección sin calificar
        socket.emit('ultimaRecoleccionSinCalificar', { recoleccion });
      }
    } catch (error) {
      console.error('Error al obtener la última recolección finalizada:', error);
      socket.emit('error', { message: 'Error al obtener la última recolección finalizada' });
    }
  });
});

//Recolecciones finalizadas del recolector
app.get('/recolecciones-finalizadas', async(req, res) =>{
  const { recolectorId } = req.query;
  console.log('recolectorId:', recolectorId);
  if(!recolectorId){
    return res.status(400).json({error: 'ID del recolector es requerido'});
  }

  try{
    //contar recolecciones con estado finalizada
    const recoleccionesFinalizadas = await Recoleccion.count({
      where: {
          recolectores_id: recolectorId, //ID del recolector
          estado: 'finalizada'
      }
    });

    res.json({ recoleccionesFinalizadas });
  }catch(error){
    console.error('Error al obtener las recolecciones finalizadas:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

//Recolecciones finalizadas del restaurante
app.get('/recolecciones-finalizadas-restaurante', async (req, res) => {
  const { restauranteId } = req.query;

  if (!restauranteId) {
    return res.status(400).json({ error: 'ID del restaurante es requerido' });
  }

  try {
    const recoleccionesFinalizadas = await Recoleccion.count({
      where: {
        restaurantes_id: restauranteId,
        estado: 'finalizada'
      }
    });

    // Emitir el número de recolecciones al cliente que hizo la solicitud
    io.to(req.socketId).emit('recoleccionesFinalizadas', { recoleccionesFinalizadas });

    // Respuesta original para compatibilidad
    res.json({ recoleccionesFinalizadas });
  } catch (error) {
    console.error('Error al obtener las recolecciones finalizadas:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

//contador de notificaciones no leidas(campana)
app.get('/notificaciones-no-leidas', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.user.id;  // Obtener el ID del usuario autenticado

    // Buscar las notificaciones no leídas para el usuario
    const notificacionesNoLeidas = await Notificacion.count({
      where: {
        usuarios_id: usuarioId,
        leida: false  // Solo las no leídas
      }
    });

    // Enviar la cantidad de notificaciones no leídas como respuesta
    res.json({ cantidad: notificacionesNoLeidas });
  } catch (error) {
    console.error('Error al obtener las notificaciones no leídas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para marcar notificaciones como leídas
app.post('/marcar-notificaciones-como-leidas', verificarToken, async (req, res) => {
  try {
      const usuarioId = req.user.id;
      await Notificacion.update({ leida: true }, { where: { usuarios_id: usuarioId, leida: false } });
      res.json({ success: true });
  } catch (error) {
      console.error('Error al marcar las notificaciones como leídas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener las notificaciones del recolector
app.get('/notificaciones-recolector', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.user.id;  // Obtener el ID del usuario autenticado (el recolector)

    // Buscar las notificaciones del recolector ordenadas por fecha
    const notificaciones = await Notificacion.findAll({
      where: { usuarios_id: usuarioId },  // Filtrar por el ID del usuario
      order: [['fecha', 'DESC']]  // Ordenar por fecha de manera descendente
    });

    // Enviar las notificaciones como respuesta
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener las notificaciones del recolector:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/calificar/:recoleccionId', verificarToken, async (req, res) => {
  const { recoleccionId } = req.params;
  const { calificacion, comentario, fechaCalificacion } = req.body;

  try {
    if (typeof calificacion !== 'number' || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ success: false, message: 'Calificación inválida' });
    }

    if (comentario && typeof comentario !== 'string') {
      return res.status(400).json({ success: false, message: 'Comentario inválido' });
    }

    if (fechaCalificacion && isNaN(Date.parse(fechaCalificacion))) {
      return res.status(400).json({ success: false, message: 'Fecha de calificación inválida' });
    }

    const recoleccion = await Recoleccion.findByPk(recoleccionId);
    if (!recoleccion) {
      return res.status(404).json({ success: false, message: 'Recolección no encontrada' });
    }

    recoleccion.calificacion = calificacion;
    if (comentario) {
      recoleccion.comentario = comentario;
    }
    if (fechaCalificacion) {
      recoleccion.fechaCalificacion = new Date(fechaCalificacion);
    }

    await recoleccion.save();

    res.json({ success: true, message: 'Calificación, comentario y fecha guardados correctamente' });
  } catch (error) {
    console.error('Error al guardar la calificación:', error);
    res.status(500).json({ success: false, message: 'Error al guardar la calificación' });
  }
});

// Endpoint para que el recolector visualice sus calificaciones
app.get('/calificaciones-recolector/:recolectorId', verificarToken, async (req, res) => {
  const { recolectorId } = req.params;

  try {
      // Busca todas las recolecciones donde el recolector haya sido calificado
      const recolecciones = await Recoleccion.findAll({
          where: {
              recolectores_id: recolectorId, // Cambiado a recolectores_id para coincidir con la base de datos
              calificacion: {
                  [Op.not]: null
              }
          },
          include: [
              {
                  model: Restaurante,
                  attributes: ['nombre']
              }
          ]
      });

      if (!recolecciones || recolecciones.length === 0) {
          return res.status(404).json({ success: false, message: 'No se encontraron calificaciones.' });
      }

      res.json({
          success: true,
          calificaciones: recolecciones.map(recoleccion => ({
              restaurante: recoleccion.restaurante.nombre,
              calificacion: recoleccion.calificacion,
              comentario: recoleccion.comentario || ' '
          }))
      });
  } catch (error) {
      console.error('Error al obtener las calificaciones:', error);
      res.status(500).json({ success: false, message: 'Error al obtener las calificaciones' });
  }
});

// Endpoint para obtener las notificaciones del restaurante
app.get('/notificaciones-restaurante', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.user.id;  // Obtener el ID del usuario autenticado

    // Buscar las notificaciones del usuario (restaurante) ordenadas por fecha
    const notificaciones = await Notificacion.findAll({
      where: { usuarios_id: usuarioId },  // Filtrar por el ID del usuario
      order: [['fecha', 'DESC']]  // Ordenar por fecha de manera descendente
    });

    // Enviar las notificaciones como respuesta
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener las notificaciones del restaurante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/notificacion-consejo', async (req, res) => {
  try {
    const [consejo] = await sequelize.query(
      'SELECT texto FROM notificaciones_consejos ORDER BY RAND() LIMIT 1',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (consejo) {
      res.json({ success: true, texto: consejo.texto });
    } else {
      res.json({ success: false, message: 'No hay consejos disponibles.' });
    }
  } catch (error) {
    console.error('Error al obtener un consejo aleatorio:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();  // Recuperar todos los usuarios
    res.json(usuarios);  // Enviar los usuarios en formato JSON
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para cerrar sesión (logout)
app.post('/logout', (req, res) => {
  // Eliminar la cookie 'jwt' estableciendo una expiración en el pasado
  res.clearCookie('jwt', {
    httpOnly: true,  // Para mayor seguridad, aseguramos que la cookie es HTTP-only
    secure: process.env.NODE_ENV === 'production'  // Aseguramos que solo se use en producción con HTTPS
  });
  res.redirect('/');
});

server.listen(process.env.PORT_SERVER, function () {//se cambio app.listen por server.listen para que socket y express se conecten al mismo puerto
  console.log("Servidor en el puerto " + process.env.PORT_SERVER);
});