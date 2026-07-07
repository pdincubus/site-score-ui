function isPageSpeedImportEnabled() {
    return import.meta.env.VITE_ENABLE_PAGESPEED_IMPORT === 'true';
}

export { isPageSpeedImportEnabled };
