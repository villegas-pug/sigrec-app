// SPEC 039. Integración con la intranet del INABIF. Los valores se inyectan en quasar.config.js › build.env.
const texto = (valor, respaldo = '') => (valor === undefined || valor === null || valor === '' ? respaldo : String(valor))

export const INTRANET = {
  // Base del servicio SRH (sin barra final).
  srhUrl: texto(process.env.SIGREC_SRH_URL).replace(/\/+$/, ''),
  // Identificador de SIGREC en SRH. Se usa para consultar el menú.
  sistemaId: texto(process.env.SIGREC_SISTEMA_ID),
  // Destino cuando el usuario no está autorizado o la sesión termina.
  urlIntranet: texto(process.env.SIGREC_INTRANET_URL),
  // Destino del botón «Salir», igual que educalle-app.
  urlSalir: texto(process.env.SIGREC_SALIR_URL),
  // Vigencia del token de sesión local y su clave de firma (viaja en el bundle: controla caducidad, no seguridad).
  minutosToken: Number(texto(process.env.SIGREC_TOKEN_EXPIRATION_MINUTES, '240')) || 240,
  secretoToken: texto(process.env.SIGREC_TOKEN_SECRET, 'sigrec-desarrollo')
}

// Prefijo de las claves de localStorage (educalle-app usa «sgs-»).
export const PREFIJO = 'sgr-'
