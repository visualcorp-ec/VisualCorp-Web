---
description: Sincroniza la carpeta local con los cambios en GitHub
---
// turbo-all
1. Añadir cambios, confirmar y sincronizar con el repositorio remoto
```powershell
git add .
git commit -m "Auto-sync: Actualización de archivos del proyecto"
git fetch origin
git pull origin main --rebase
git push origin main
```
