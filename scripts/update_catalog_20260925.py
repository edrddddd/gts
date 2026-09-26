"""Apply the reviewed September 2026 announcements. No credentials or network needed."""
from copy import deepcopy
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

def main():
    path = ROOT / 'data/cursos.json'
    courses = json.loads(path.read_text(encoding='utf-8'))
    by_id = {c['id']: c for c in courses}
    jose = deepcopy(by_id['c31']['instructor'])
    jose['desc'] = 'Bioinformático, investigador y formador especializado en genómica, transcriptómica, bioestadística aplicada y análisis de datos ómicos.'
    bio = by_id['c31']
    bio['instructor'] = jose
    bio['temario'] = [
        'Fundamentos de bioestadística', 'Análisis y visualización de datos en R',
        'Estadística descriptiva aplicada a datos biológicos', 'Selección e interpretación de pruebas estadísticas',
        'Comparación de grupos', 'Correlación, regresión y asociación entre variables',
        'Aplicaciones en datos ómicos', 'Interpretación y comunicación de resultados',
    ]
    bio.pop('temarioNota', None)
    bio['fuente'] = 'https://www.facebook.com/122182068602829797/posts/122203410122829797'
    bio['verificado'] = '2026-09-25'
    meta = by_id['c29']
    meta['temario'] = [
        'Fundamentos de metagenómica 16S, 18S e ITS',
        'Manejo de archivos FASTQ y control de calidad con FastQC y MultiQC',
        'Procesamiento y depuración de secuencias', 'Análisis con DADA2 y QIIME 2',
        'Identificación de ASVs', 'Clasificación taxonómica', 'Análisis de diversidad alfa y beta',
        'Visualización e interpretación de comunidades microbianas',
        'Análisis y visualización en R con phyloseq y ggplot2',
    ]
    meta.pop('temarioNota', None)
    meta['fuente'] = 'https://www.facebook.com/122182068602829797/posts/122201562056829797'
    meta['verificado'] = '2026-09-25'
    epi = by_id['c30']
    if not isinstance(epi['instructor'], list):
        epi['instructor'] = [deepcopy(jose), epi['instructor']]
    epi.update({
        'descripcion': 'Aprende a procesar, visualizar e interpretar datos de ChIP-seq, CUT&RUN, ATAC-seq y metilación del ADN. Cuatro sesiones con práctica guiada, desde el control de calidad hasta la interpretación de resultados.',
        'fechas': '19, 20, 26 y 27 de septiembre de 2026', 'inicio': '2026-09-19', 'fin': '2026-09-27',
        'horario': '9:00 a 12:00 h (CDMX)', 'duracion': '12 horas · 4 sesiones de 3 horas',
        'temario': [
            'Fundamentos y diferencias entre ChIP-seq, CUT&RUN y ATAC-seq',
            'Control de calidad y procesamiento de archivos FASTQ', 'Alineamiento al genoma de referencia',
            'Llamado de picos y análisis de regiones diferenciales', 'Visualización de señales genómicas con IGV y deepTools',
            'Análisis e interpretación de perfiles de metilación del ADN', 'Anotación funcional y análisis de resultados en R',
        ],
        'incluye': ['Sesiones en vivo y acceso a las grabaciones', 'Recursos y materiales didácticos',
                    'Ejercicios prácticos guiados', 'Visualización de señales genómicas',
                    'Análisis de perfiles de metilación', 'Constancia digital de participación'],
        'cartelVigente': False,
        'fuente': 'https://www.facebook.com/122182068602829797/posts/122203409918829797',
        'verificado': '2026-09-25',
    })
    new_courses = [
        {
            'id': 'c33', 'titulo': 'RNA-seq desde cero: análisis bioinformático del transcriptoma',
            'categoria': 'Transcriptómica', 'etiquetaVisual': 'RNA-seq',
            'descripcion': 'Del control de calidad al análisis de expresión diferencial en R. Aprende a visualizar e interpretar datos del transcriptoma con práctica guiada y ejemplos aplicados.',
            'inicio': '2026-10-20', 'fin': '2026-10-29', 'fechas': '20, 22, 27 y 29 de octubre de 2026',
            'temario': ['Fundamentos de RNA-seq y análisis transcriptómico', 'Descarga y control de calidad de datos de secuenciación',
                        'Alineamiento y cuantificación de la expresión génica', 'Análisis de expresión diferencial en R',
                        'Visualización de resultados: PCA, volcano plots y heatmaps', 'Enriquecimiento funcional: GO y KEGG',
                        'Interpretación biológica de resultados'],
            'fuente': 'https://www.facebook.com/122182068602829797/posts/122204155094829797',
            'formulario': 'https://forms.gle/VywBCFCjdrExFded7',
        },
        {
            'id': 'c32', 'titulo': 'Metagenómica shotgun desde cero: análisis bioinformático',
            'categoria': 'Metagenómica', 'etiquetaVisual': 'Shotgun',
            'descripcion': 'Explora comunidades microbianas desde las lecturas hasta los resultados taxonómicos y funcionales. Aprende ensamblaje, binificación y análisis en R paso a paso.',
            'inicio': '2026-10-06', 'fin': '2026-10-15', 'fechas': '6, 8, 13 y 15 de octubre de 2026',
            'temario': ['Fundamentos del análisis metagenómico shotgun', 'Procesamiento y control de calidad de lecturas',
                        'Ensamblaje de metagenomas', 'Binificación y asignación taxonómica',
                        'Anotación funcional y análisis metabólico', 'Visualización y análisis estadístico en R'],
            'fuente': 'https://www.facebook.com/122182068602829797/posts/122204154542829797',
            'formulario': 'https://forms.gle/mm8BSbbQZgpHoK8Y9',
        },
    ]
    for course in new_courses:
        course.update({
            'img': '', 'instructor': deepcopy(jose), 'horario': '17:00 a 20:00 h (CDMX)',
            'duracion': '12 horas · 4 sesiones de 3 horas', 'modalidad': '100 % en línea',
            'incluye': ['Sesiones grabadas', 'Recursos y material didáctico', 'Ejercicios prácticos guiados', 'Constancia digital de participación'],
            'nivel': 'Desde cero', 'zonaHoraria': 'America/Mexico_City', 'precios': None,
            'inscripcionConfirmada': False, 'verificado': '2026-09-25',
        })
    courses = new_courses + [c for c in courses if c['id'] not in {'c32', 'c33'}]
    path.write_text(json.dumps(courses, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('33 courses: verified September corrections and October announcements applied.')

if __name__ == '__main__':
    main()
