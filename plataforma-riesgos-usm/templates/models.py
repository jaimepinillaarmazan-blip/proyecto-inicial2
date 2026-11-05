from django.db import models

# Create your models here.
class ReporteUrbano(models.Model):
    CATEGORIAS = [
        ('Bache', '🕳️ Bache'),
        ('Luminaria', '💡 Luminaria rota'),
        ('Basura', '🗑️ Basura acumulada'),
        ('Otro', '⚠️ Otro'),
    ]

    categoria = models.CharField(max_length=50, choices=CATEGORIAS)
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    latitud = models.FloatField()
    longitud = models.FloatField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.categoria} - {self.fecha_creacion.strftime('%d/%m/%Y %H:%M')}"