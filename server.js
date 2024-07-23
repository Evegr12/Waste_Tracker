const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = 8080;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Middleware para manejar datos del formulario
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
const upload = multer();


// Configuración del cliente de conexión a la base de datos
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Delleve',
    database: 'wastetracker'
});

// Configuración de Sequelize
const sequelize = new Sequelize('wastetracker', 'postgres', 'Delleve', {
  host: 'localhost',
  dialect: 'postgres'
});

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
    type: DataTypes.STRING(45),
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
    type: DataTypes.STRING(45),
    allowNull: false
  }
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
    allowNull: false,
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
    allowNull: false
  },
  calificacion: {
    type: DataTypes.INTEGER,
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
Usuario.hasMany(Restaurante, { foreignKey: 'usuarios_id' });
Restaurante.belongsTo(Usuario, { foreignKey: 'usuarios_id' });

Usuario.hasMany(Recolector, { foreignKey: 'usuarios_id' });
Recolector.belongsTo(Usuario, { foreignKey: 'usuarios_id' });

Restaurante.hasMany(Recoleccion, { foreignKey: 'restaurantes_id' });
Recoleccion.belongsTo(Restaurante, { foreignKey: 'restaurantes_id' });

Recolector.hasMany(Recoleccion, { foreignKey: 'recolectores_id' });
Recoleccion.belongsTo(Recolector, { foreignKey: 'recolectores_id' });

// Sincronizar la base de datos
sequelize.sync({ force: true })
  .then(() => {
    console.log('Tablas sincronizadas');
  })
  .catch(error => console.error('No se pudo sincronizar las tablas:', error));

// Configuración de CORS
const corsOptions = {
    origin: '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));

// Ruta raíz, devuelve el archivo HTML principal
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/inicioRestaurante', function (req, res) {
  res.sendFile(path.join(__dirname, 'inicioRestaurante.html'));
});

// Ruta para login
app.post('/login', async (req, res) => {
  const { correo, contrasenia } = req.body;

  try {
      // Intentar primero con usuario tipo restaurante
      let query = `SELECT * FROM usuarios WHERE correo = $1 AND contrasenia = $2`;
      let result = await pool.query(query, [correo, contrasenia]);

      if (result.rows.length > 0) {
          const user = result.rows[0];
          // Verifica el tipo de usuario (por ejemplo, por su id o rol)
          if (user.tipo_usuario === 'restaurante') {
              res.json({ tipo_usuario: 'restaurante' });
          } else if (user.tipo_usuario === 'recolector') {
              res.json({ tipo_usuario: 'recolector' });
          } else {
              res.status(401).send('Tipo de usuario no válido');
          }
          return;
      }

      // Ningún usuario encontrado con las credenciales proporcionadas
      res.status(401).send('Correo electrónico o contraseña incorrectos');
  } catch (error) {
      console.error('Error al iniciar sesión', error);
      res.status(500).send('Error interno del servidor');
  }
});


// Ruta para la página de inicio del restaurante
app.post('/registroRestaurante', upload.none(), async (req, res) => {
  console.log('Datos recibidos:', req.body);
  const { usuario, nombre, correo, nombre_restaurante, direccion, contrasenia } = req.body;

  if (!usuario || !nombre || !correo || !nombre_restaurante || !direccion || !contrasenia) {
      return res.status(400).send('Todos los campos son requeridos');
  }

  const client = await pool.connect();
  try {
      await client.query('BEGIN');
      const query1 = `INSERT INTO usuarios (usuario, nombre, correo, contrasenia, tipo_usuario) VALUES ($1, $2, $3, $4, 'restaurante') RETURNING id`;
      const res1 = await client.query(query1, [usuario, nombre, correo, contrasenia]);

      const userId = res1.rows[0].id;
      const query2 = `INSERT INTO restaurantes (nombre, direccion, usuarios_id) VALUES ($1, $2, $3)`;
      await client.query(query2, [nombre_restaurante, direccion, userId]);

      await client.query('COMMIT');
      res.send('Usuario restaurante registrado correctamente');
  } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al registrar usuario restaurante', error);
      res.status(500).send('Error interno del servidor');
  } finally {
      client.release();
  }
});

// Ruta para registro de recolectores
app.post('/registroRecolector', upload.none(), async (req, res) => {
    const { usuario, nombre, correo, contrasenia } = req.body;
    if (!usuario || !nombre || !correo || !contrasenia) {
        return res.status(400).send('Todos los campos son requeridos');
    }
    try {
        const query1 = `INSERT INTO usuarios (usuario, nombre, correo, contrasenia, tipo_usuario) VALUES ($1, $2, $3, $4, 'recolector') RETURNING id`;
        const result1 = await pool.query(query1, [usuario, nombre, correo, contrasenia]);
        const userId = result1.rows[0].id;

        const query2 = `INSERT INTO recolectores (usuarios_id) VALUES ($1)`;
        await pool.query(query2, [userId]);

        res.send('Recolector registrado correctamente');
    } catch (error) {
        console.error('Error al registrar recolector', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para obtener usuarios
app.get('/usuario', async (req, res) => {
    try {
        const query = 'SELECT * FROM usuarios';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener datos de usuarios', error);
        res.status(500).send('Error interno del servidor');
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

