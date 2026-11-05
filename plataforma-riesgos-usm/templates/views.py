from django.shortcuts import render
rom django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import ReporteUrbano

# Create your views here.
def index(request):
    return render(request, 'plataforma-riesgos-usm/index.html')

    @csrf_exempt
def guardar_reporte(huesped, request): # (o def guardar_reporte(request):)
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            ReporteUrbano.objects.create(
                categoria=data.get('categoria'),
                descripcion=data.get('descripcion'),
                latitud=data.get('latitud'),
                longitud=data.get('longitud')
            )
            return JsonResponse({'status': 'success', 'mensaje': 'Reporte guardado con éxito'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'mensaje': 'Método no permitido'}, status=405)