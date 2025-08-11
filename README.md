# Dashboard de Expensas de Barrio Privado

Este proyecto es un dashboard interactivo y responsivo diseñado para visualizar y analizar los datos de expensas de un barrio privado. La aplicación carga datos desde archivos CSV y los presenta en una serie de gráficos dinámicos, permitiendo a los usuarios filtrar y explorar la información de manera intuitiva.

## 🚀 Características Principales

- **Visualización de Datos Avanzada:** Múltiples gráficos interactivos generados con **Highcharts**:
  - **Gráfico de Líneas (Evolución Mensual Gastos Totales):** Muestra la evolución de los gastos a lo largo del tiempo para múltiples categorías.
  - **Gráfico de Líneas (Evolución Gastos Individuales):** Muestra la evolución de gastos individuales a lo largo del tiempo.
  - **Gráfico de Barras Horizontales (Gastos por Categoría):** Muestra los gastos mensuales por categoría con una barra por mes.
  - **Gráfico de Torta (Proporción por Categoría):** Muestra la distribución porcentual de gastos por categoría.
  - **Diagrama de Sankey (Desglose Detallado):** Muestra el flujo de gastos para la categoría con mayor monto, desglosado por subcategorías.

- **Filtros Inteligentes:**
  - **Filtro de Meses:** Menú desplegable multi-selección con checkboxes, ordenado del mes más reciente al más antiguo.
  - **Filtro de Categorías:** Permite seleccionar múltiples categorías para comparar.
  - **Selección Múltiple:** Soporta selección de múltiples elementos con opción "Todos".
  - **Interfaz Intuitiva:** Los botones muestran la selección actual de manera clara.
  - **Filtrado en Tiempo Real:** Los gráficos se actualizan automáticamente al cambiar los filtros.

- **Diseño Moderno y Responsivo:**
  - Totalmente adaptable a dispositivos móviles, tablets y escritorio.
  - Interfaz limpia y profesional con paleta de colores pastel.
  - Gráficos que se ajustan automáticamente al tamaño de la pantalla.
  - Diseño optimizado para móviles con gráficos apilados verticalmente.
  - Visualización de Sankey con altura dinámica basada en la cantidad de datos.

- **Tecnologías Utilizadas:**
  - Highcharts para visualizaciones interactivas
  - CSS3 con diseño responsive
  - JavaScript moderno (ES6+)
  - Carga asíncrona de datos desde CSV

## 📂 Estructura de Archivos

```
expensasCanitas/
├── data/
│   ├── expensas.csv      # Archivo con los datos de gastos generales en formato CSV
│   └── individual.csv    # Archivo con los datos de gastos individuales
├── index.html            # Estructura principal de la página web
├── script.js             # Lógica principal de la aplicación
├── style.css             # Estilos personalizados
└── README.md             # Documentación del proyecto
```

## 🆕 Novedades

- **Agosto 2024:**
  - Agregado gráfico de Sankey para visualizar el desglose de gastos de la categoría principal
  - Mejorada la visualización en dispositivos móviles
  - Ordenamiento de meses de más reciente a más antiguo en los filtros
  - Agrupación automática de subcategorías menores al 1% como 'Otros'
  - Optimización del rendimiento para grandes conjuntos de datos
  - Mejoras en la paleta de colores y la legibilidad

## 🚀 Cómo Ejecutar el Proyecto

Para ejecutar el proyecto localmente, sigue estos pasos:

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (debido a restricciones de CORS)

### Opción 1: Usando Live Server (Recomendado)
1. Instala la extensión [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) en VS Code
2. Haz clic derecho en `index.html`
3. Selecciona "Open with Live Server"

### Opción 2: Usando Python
1. Abre una terminal en la carpeta del proyecto
2. Ejecuta uno de estos comandos:
   ```bash
   # Python 3
   python -m http.server
   
   # Python 2
   python -m SimpleHTTPServer
   ```
3. Abre tu navegador en `http://localhost:8000`

### Opción 3: Usando Node.js
Si tienes Node.js instalado:
```bash
npx http-server
```

## 📱 Compatibilidad Móvil
El dashboard está completamente optimizado para:
- ✅ Smartphones (iOS y Android)
- ✅ Tablets
- ✅ Escritorio

### Características para móviles:
- Menús desplegables optimizados para pantallas táctiles
- Gráficos que se ajustan automáticamente
- Botones de tamaño adecuado para interacción táctil
- Rendimiento optimizado para dispositivos móviles

## 🛠 Personalización

### Modificar Datos
Simplemente edita el archivo `data/expensas.csv` siguiendo el formato:
```
mes,categoria,subcategoria,monto,descripcion
2023-01,Mantenimiento,Limpieza,15000.00,Limpieza de espacios comunes
```

### Cambiar Estilos
Los estilos principales se encuentran en `style.css`. Puedes personalizar:
- Paleta de colores
- Tipografía
- Tamaños y espaciados
- Estilos de los gráficos

## 📄 Licencia
Este proyecto está disponible bajo la licencia MIT. Ver el archivo `LICENSE` para más información.
   - Abre tu navegador y ve a la dirección `http://localhost:8000`.

## Tecnologías Utilizadas

- **HTML5**
- **CSS3**
- **JavaScript (ES6+)**
- **Tailwind CSS:** Para un diseño rápido y responsivo.
- **Chart.js:** Para la creación de los gráficos interactivos.
