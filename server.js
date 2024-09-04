require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');  
const app = express();
const Nominatim = require('nominatim-client');
const nominatim = Nominatim.createClient({
  useragent: "MyApp",             
  referer: 'http://example.com', 
});
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server);

// Configura el manejo de eventos de Socket.io
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});



// Configuración de CORS
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
const upload = multer();
app.use(session({
  secret: 'Dellevesecret', // Clave secreta
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true } //true si se está usando HTTPS
}));

app.use(cors({
  origin:'http://localhost:8080', // Cambia esto al dominio de tu frontend
  methods: ['GET', 'POST'],
  credentials: true
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
    allowNull: false
  },
  contrasenia: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  tipo_usuario: {
    type: DataTypes.STRING(45),
    allowNull: false
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
  estado: {
    type: DataTypes.STRING,
    defaultValue: 'pendiente',  // Estado: 'pendiente', 'en proceso', 'completado'
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
const MensajeRecoleccion = sequelize.define('mensajes_recoleccion', {
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
  tableName: 'mensajes_recoleccion',
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

// Middleware para verificar el token JWT
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ error: 'Token no proporcionado' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
          if (err.name === 'TokenExpiredError') {
              return res.status(403).json({ error: 'Token expirado. Por favor, inicia sesión nuevamente.' });
          }
          console.error('Error al verificar el token:', err);
          return res.status(403).json({ error: 'Token inválido' });
      }
      req.user = user; // Asegúrate de que el token contenga la información necesaria
      next();
  });
}


// Ruta para login
app.post('/login', async (req, res) => {
  const { correo, contrasenia } = req.body;

  try {
    let query = `SELECT * FROM usuarios WHERE correo = ?`;
    let results = await sequelize.query(query, { replacements: [correo], type: sequelize.QueryTypes.SELECT });

    if (results && results.length > 0) {
      const user = results[0];
      const match = await bcrypt.compare(contrasenia, user.contrasenia);
      if (!match) {
        return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
      }

      const restaurante = await Restaurante.findOne({ where: { usuarios_id: user.id } });

      // Si el restaurante existe, se obtiene su dirección
      const direccion = restaurante ? restaurante.direccion : null;

      const token = generarToken(user);
      res.json({ 
        token, 
        tipo_usuario: user.tipo_usuario,
        restaurantes_id: restaurante ? restaurante.id : null,
        direccion: direccion // Incluye la dirección en la respuesta
      });
    } else {
      res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error al iniciar sesión', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Ruta raíz, devuelve el archivo HTML principal
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/inicioRestaurante', function (req, res) {
  res.sendFile(path.join(__dirname, 'inicioRestaurante.html'));
});

app.get('/inicioRecolector', function (req, res) {
  res.sendFile(path.join(__dirname, 'inicioRecolector.html'));
});


// Ruta para registro de restaurante
app.post('/registroRestaurante', upload.none(), async (req, res) => {
  const { usuario, nombre, correo, nombre_restaurante, direccion, contrasenia } = req.body;

  if (!usuario || !nombre || !correo || !nombre_restaurante || !direccion || !contrasenia) {
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
        tipo_usuario: 'restaurante',
      }, { transaction: t });

      await Restaurante.create({
        nombre: nombre_restaurante,
        direccion,
        usuarios_id: newUser.id
      }, { transaction: t });
    });

    res.send('Usuario restaurante registrado correctamente');
  } catch (error) {
    console.error('Error al registrar usuario restaurante', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para registro de recolectores
app.post('/registroRecolector', upload.none(), async (req, res) => {
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

    alert('Usuario recolector registrado correctamente');
  } catch (error) {
    console.error('Error al registrar usuario recolector', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Función para obtener las coordenadas a partir de la dirección
async function obtenerCoordenadas(direccion) {
    if (!direccion) {
        console.error("La dirección es undefined o vacía. No se pueden obtener coordenadas.");
        return { lat: null, lon: null };
    }

    console.log(`Obteniendo coordenadas para la dirección: ${direccion}`);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.length > 0) {
            const { lat, lon } = data[0];
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

app.post('/solicitar-recoleccion', verificarToken, async (req, res) => {
  console.log("Datos recibidos en la solicitud:", req.body);
  const { direccion, restaurantes_id } = req.body;
  console.log("Dirección recibida:", direccion);

  try {
    // Obtener las coordenadas de la dirección
    const coordenadas = await obtenerCoordenadas(direccion);

    // Mostrar las coordenadas
    console.log("Coordenadas obtenidas:", coordenadas);

    // Actualizar las coordenadas en la tabla restaurantes
    await Restaurante.update(
      { latitude: coordenadas.lat, longitude: coordenadas.lon },
      { where: { id: restaurantes_id } }
    );

    // Crear la solicitud de recolección
    const recoleccion = await Recoleccion.create({
      restaurantes_id: restaurantes_id,
      fecha_solicitud: new Date(),
      estado: 'pendiente'
    });

    // Enviar una respuesta al cliente
    res.json({ message: "Solicitud de recolección enviada correctamente" });
  } catch (error) {
    console.error('Error al guardar la solicitud de recolección:', error);
    res.status(500).json({ error: 'Error al enviar la solicitud de recolección' });
  }
});

// Ruta para obtener solicitudes de recolección pendientes
app.get('/solicitudes-pendientes', async (req, res) => {
  try {
    const solicitudesPendientes = await Recoleccion.findAll({
      where: {
        estado: 'pendiente',
      },
      include: [{
        model: Restaurante,
        attributes: ['latitude', 'longitude', 'direccion'],
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

// Ruta para aceptar la recolección
app.post('/aceptar-recoleccion', verificarToken, verificarRecolector, async (req, res) => {
  const { recoleccion_id } = req.body;
  if (!recoleccion_id) {
    return res.status(400).json({ error: 'ID de recolección es requerido' });
  }

  const recolectorId = req.recolector.id; // Obtén el ID del recolector desde req.recolector
  if (!recolectorId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    // Encuentra la recolección por su ID
    const recoleccion = await Recoleccion.findByPk(recoleccion_id);
    
    if (!recoleccion) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (recoleccion.estado !== 'pendiente') {
      return res.status(400).json({ error: 'La solicitud ya está en proceso o completada' });
    }

    // Actualiza el estado de la recolección y asigna el recolector
    await recoleccion.update({
      estado: 'en proceso',
      recolectores_id: recolectorId
    });

    // Emitir evento de actualización si se está usando Websockets
    io.emit('recoleccion-actualizada', {
      id: recoleccion_id,
      estado: 'en proceso',
      recolector: recolectorId
    });

    res.json({ message: 'Solicitud aceptada y en proceso' });
  } catch (error) {
    console.error('Error al aceptar la recolección:', error);
    res.status(500).json({ error: 'Error al aceptar la recolección' });
  }
});

app.post('/actualizar-ubicacion-recolector', verificarToken, async (req, res) => {
  const { latitude, longitude } = req.body;
  const recolectorId = req.recolector.id; // Obtén el ID del recolector desde req.recolector

  if (!recolectorId) {
      return res.status(401).json({ error: 'No autorizado' });
  }

  try {
      // Actualiza la ubicación del recolector en la base de datos
      await UbicacionRecolector.upsert({
          recolector_id: recolectorId,
          latitude,
          longitude
      });

      res.json({ message: 'Ubicación actualizada correctamente' });
  } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
});

// Ruta para obtener solicitudes de recolección aceptadas
app.get('/solicitudes-aceptadas', verificarToken, verificarRecolector, async (req, res) => {
  try {
    const solicitudesAceptadas = await Recoleccion.findAll({
      where: {
        recolectores_id: req.recolector.id,  // Filtra por el recolector que aceptó la solicitud
        estado: 'en proceso'  // Cambia a 'completado' si necesitas ambas
      },
      include: [{
        model: Restaurante,
        attributes: ['latitude', 'longitude', 'direccion'],
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

// Datos de ubicación de ejemplo
const ubicacionRecolector = {
    latitude: 19.4326,
    longitude: -99.1332
};

io.on('connection', ws => {
    console.log('Cliente conectado');
    
    // Enviar la ubicación del recolector a todos los clientes conectados
    setInterval(() => {
        // Puedes obtener la ubicación en tiempo real aquí
        ws.send(JSON.stringify(ubicacionRecolector));
    }, 5000); // Enviar cada 5 segundos
});

//ruta notificaciones
app.get('/notificaciones', async (req, res) => {
  try {
    const result = await sequelize.query('SELECT texto FROM notificaciones_consejos', { type: sequelize.QueryTypes.SELECT });
    res.json(result.length > 0 ? result : []);  // Envía un array vacío si no hay resultados
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/mensaje-recoleccion', async (req, res) => {
  try {
    // Obtener el mensaje con id = 1
    const mensaje = await MensajeRecoleccion.findOne({ where: { id: 1 } });

    if (!mensaje) {
      return res.status(404).json({ error: "Mensaje no encontrado" });
    }

    res.json({ success: true, mensaje: mensaje.texto });
  } catch (error) {
    console.error('Error al obtener el mensaje de recolección:', error);
    res.status(500).json({ error: 'Error al obtener el mensaje de recolección' });
  }
});

app.get('/consejo-aleatorio', async (req, res) => {
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


// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al destruir la sesión:', err);
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.redirect('/'); // Redirige al usuario a la página de login u otra página
  });
});


app.listen(process.env.PORT_SERVER, function () {
  console.log("Servidor en el puerto " + process.env.PORT_SERVER);
});