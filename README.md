# inventory-back

API REST para un sistema de inventario. Backend de [inventory-front](https://github.com/shompaa/inventory-front).

## Stack

Node.js (ESM) · Express 4 · Firebase Admin · JWT · bcrypt · express-validator · Multer

## Estructura

```
index.js          entrada del servidor
src/
  database/       conexión a Firebase
  middlewares/    autenticación y validación
  modules/        rutas y lógica por dominio
  utils/          helpers compartidos
```

## Uso

```bash
npm install
npm run dev     # nodemon
npm start       # producción
```

Las credenciales (Firebase, secreto JWT, puerto) van en un `.env`, que no se versiona.

## Estado

Proyecto de 2023, sin cambios desde entonces. Sin tests.
