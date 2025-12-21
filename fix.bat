 
@echo off  
setlocal enabledelayedexpansion  
for /f \"delims=\" %%%%a in ('type app\pos\catalog\page.tsx') do (  
  set \"line=%%%%a\"  
  if \"!line:overflow-hidden lg:overflow-hidden=!\" neq \"!line!\" (  
    set \"line=!line:overflow-hidden lg:overflow-hidden bg-white rounded-xl shadow-lg min-h-0 min-h-auto lg:min-h-0=overflow-y-auto lg:overflow-hidden bg-white rounded-xl shadow-lg min-h-0!\"  
  )  
  echo !line!  
) > app\pos\catalog\page.tsx.tmp  
move /y app\pos\catalog\page.tsx.tmp app\pos\catalog\page.tsx  
