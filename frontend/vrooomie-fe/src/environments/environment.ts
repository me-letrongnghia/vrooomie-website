// Development environment (ng serve)
export const environment = {
    production: false,
    // Use relative URLs so nginx can proxy to backend
    // When running with ng serve locally, update these to full URLs
    baseUrl: 'http://localhost:8080/api',
    frontendUrl: 'http://localhost:4200',
    oauth2Url: 'http://localhost:8080/oauth2/authorization'
};