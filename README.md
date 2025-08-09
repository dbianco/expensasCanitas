# Dashboard de Expensas de Barrio Privado

Este proyecto es un dashboard interactivo y responsivo diseñado para visualizar y analizar los datos de expensas de un barrio privado. La aplicación carga datos desde un archivo CSV y los presenta en una serie de gráficos dinámicos, permitiendo a los usuarios filtrar y explorar la información de manera intuitiva.

## Características Principales

- **Visualización de Datos:** Tres gráficos interactivos generados con Chart.js:
  - **Gráfico de Líneas (Evolución Mensual):** Muestra la evolución de los gastos a lo largo del tiempo para las categorías seleccionadas.
  - **Gráfico de Barras (Gastos por Categoría):** Compara los gastos totales por categoría dentro del período de tiempo seleccionado.
  - **Gráfico de Torta (Proporción por Subcategoría):** Muestra la distribución de los gastos en subcategorías para el período seleccionado.

- **Filtros Dinámicos:**
  - **Rango de Fechas:** Permite seleccionar un mes de inicio y fin para acotar el análisis.
  - **Filtro de Categorías Avanzado:** Un menú desplegable multi-selección con checkboxes que permite:
    - Seleccionar/deseleccionar todas las categorías con una opción "Todos".
    - Seleccionar categorías individuales.
    - El texto del botón se actualiza para reflejar la selección actual ("Todos", "Ninguno", "X categorías").

- **Diseño Responsivo:** La interfaz, construida con Tailwind CSS, se adapta a diferentes tamaños de pantalla, desde dispositivos móviles hasta computadoras de escritorio.

- **Carga de Datos Asíncrona:** Los datos se cargan desde un archivo `expensas.csv` de forma asíncrona para no bloquear la interfaz de usuario.

## Estructura de Archivos

```
expensasCanitas/
├── data/
│   └── expensas.csv      # Archivo con los datos de gastos.
├── index.html            # Estructura principal de la página web.
├── script.js             # Lógica de la aplicación (carga de datos, filtros, gráficos).
├── style.css             # (Opcional) Estilos personalizados adicionales.
└── README.md             # Este archivo.
```

## Cómo Ejecutar el Proyecto

Debido a las políticas de seguridad de los navegadores (CORS), no puedes abrir el archivo `index.html` directamente desde el sistema de archivos para que la carga del `expensas.csv` funcione.

Necesitas servir los archivos a través de un servidor web local. Aquí tienes dos maneras sencillas de hacerlo:

**1. Usando la extensión "Live Server" en Visual Studio Code:**
   - Instala la extensión [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) desde el marketplace de VS Code.
   - Haz clic derecho sobre el archivo `index.html` y selecciona "Open with Live Server".

**2. Usando Python (si lo tienes instalado):**
   - Abre una terminal en la carpeta raíz del proyecto (`expensasCanitas`).
   - Ejecuta el siguiente comando:
     ```bash
     python -m http.server
     ```
   - Abre tu navegador y ve a la dirección `http://localhost:8000`.

## Tecnologías Utilizadas

- **HTML5**
- **CSS3**
- **JavaScript (ES6+)**
- **Tailwind CSS:** Para un diseño rápido y responsivo.
- **Chart.js:** Para la creación de los gráficos interactivos.
