Drop your site images here.

TEXTURES (for the "more realistic planets" upgrade)
-----------------------------------------------------
Add these exact filenames to img/textures/ and every planet — both the
small nav dots and the big hero versions on about/contact/work — will
switch from the CSS gradient look to real photographic textures
automatically. Nothing else needs to change; the CSS already references
these paths with the gradient as a fallback if a file is missing.

  img/textures/mercury.jpg
  img/textures/venus.jpg
  img/textures/earth.jpg
  img/textures/mars.jpg
  img/textures/jupiter.jpg
  img/textures/saturn.jpg

A good free, legal source for these: Solar System Scope's texture maps
(solarsystemscope.com/textures) — free 2K/8K equirectangular planet
textures under CC BY 4.0. Any roughly 2:1 equirectangular planet map
will work fine since these are used with background-size: cover.

OTHER
-----------------------------------------------------
logo.png, project screenshots like project-1.jpg, etc. — reference them
from CSS/HTML as img/logo.png, img/project-1.jpg, etc.
