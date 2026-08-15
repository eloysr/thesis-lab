# Pixel Sorting — Kim Asendorf Style

Herramienta interactiva para hacer "pixel sorting" sobre imágenes. Ordena píxeles según su brillo, color (hue) o saturación, generando las características franjas de distorsión del efecto.

## Características

- Carga de imágenes desde disco
- Tres métodos de ordenamiento:
  - **Brightness**: ordena por brillo (luminancia)
  - **Hue**: ordena por tonalidad/color
  - **Saturation**: ordena por saturación

- Controles deslizantes:
  - **Ángulo**: dirección de las líneas de ordenamiento (0-360°)
  - **Largo línea**: cuántos píxeles se ordenan por línea (10-500px)
  - **Separación**: espaciado entre líneas procesadas (1-20px)

## UI

Panel de controles estilo proyecto 005-prueba-aplicacion-p5:
- Fondo azul claro (#3498db)
- Botones minimalistas con bordes azul oscuro (#1b4f72)
- Panel flotante en la esquina superior izquierda
- Reloj en vivo con fecha y hora

## Técnica

El algoritmo:
1. Para cada línea en el ángulo especificado
2. Extrae píxeles a lo largo de esa línea (length especificado)
3. Los ordena según el criterio (brightness/hue/saturation)
4. Escribe los píxeles ordenados de vuelta

Inspirado en Kim Asendorf, 2012.
