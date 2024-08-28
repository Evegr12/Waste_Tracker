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
  origin: 'http://localhost:8080', // Cambia esto al dominio de tu frontend
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
    type: DataTypes.STRING(50),
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
    type: DataTypes.STRING(50),
    allowNull: false
  }
}, {
  tableName: 'mensajes_recoleccion',
  timestamps: false
});

// Relaciones
Restaurante.belongsTo(Usuario, { foreignKey: 'usuarios_id' });
Usuario.hasOne(Restaurante, { foreignKey: 'usuarios_id' });
Recolector.belongsTo(Usuario, { foreignKey: 'usuarios_id' });
Usuario.hasOne(Recolector, { foreignKey: 'usuarios_id' });
Restaurante.hasMany(Recoleccion, { foreignKey: 'restaurantes_id' });
Recoleccion.belongsTo(Restaurante, { foreignKey: 'restaurantes_id' });
Recolector.hasMany(Recoleccion, { foreignKey: 'recolectores_id' });
Recoleccion.belongsTo(Recolector, { foreignKey: 'recolectores_id' });

// Sincronizar la base de datos
async function sync() {
  try {
    await sequelize.sync({ force: false
     }); // No eliminar las tablas en cada sincronización
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
async function verificarToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).send('Se requiere un token');
  }
  try {
    const tokenSolo = token.split(' ')[1]; // Obtener solo el token después de 'Bearer'
    const tokenRevocado = await TokenRevocado.findOne({ where: { token: tokenSolo } });
    if (tokenRevocado) {
      return res.status(401).send('Token inválido o revocado');
    }
    const decodificado = jwt.verify(tokenSolo, process.env.JWT_SECRET);
    req.usuario = decodificado;
    next();
  } catch (error) {
    return res.status(401).send('Token inválido');
  }
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

    res.send('Usuario recolector registrado correctamente');
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

app.post('/solicitar-recoleccion', async (req, res) => {
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

//El recolector acepta la solicitud
app.post('/aceptar-recoleccion', async (req, res) => {
  const { recoleccion_id } = req.body;
  const recolectorId = req.user.id; // Obtén el ID del recolector desde el token de autenticación

  try {
    // Encuentra la solicitud de recolección
    const recoleccion = await Recoleccion.findByPk(recoleccion_id);
    
    if (!recoleccion) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (recoleccion.estado !== 'pendiente') {
      return res.status(400).json({ error: 'La solicitud ya está en proceso o completada' });
    }

    // Actualiza el estado de la solicitud y asigna el recolector
    await recoleccion.update({
      estado: 'en proceso',
      recolectores_id: recolectorId
    });

    // Enviar una respuesta al cliente
    res.json({ message: 'Solicitud aceptada y en proceso' });
  } catch (error) {
    console.error('Error al aceptar la recolección:', error);
    res.status(500).json({ error: 'Error al aceptar la recolección' });
  }
});

//ruta notificaciones
app.get('/notificaciones', async (req, res) => {
  try {
      const result = await sequelize.query('SELECT texto FROM notificaciones_consejos');
      res.json(result.rows.length > 0 ? result.rows : []);  // Envía un array vacío si no hay resultados
  } catch (error) {
      console.error('Error al obtener notificaciones:', error);
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
  // Destruir la sesión del usuario
  req.session.destroy((err) => {
      if (err) {
          console.error('Error al destruir la sesión:', err);
          return res.status(500).json({ error: 'Error al cerrar sesión' });
      }
      res.status(200).json({ message: 'Sesión cerrada correctamente' });
  });
});

app.listen(process.env.PORT_SERVER, function () {
  console.log("Servidor en el puerto " + process.env.PORT_SERVER);
});