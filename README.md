# grand-cinema-front
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=iojka_grand-cinema-front&metric=alert_status)](https://sonarcloud.io/project/overview?id=iojka_grand-cinema-front) [![Couverture](https://sonarcloud.io/api/project_badges/measure?project=iojka_grand-cinema-front&metric=coverage)](https://sonarcloud.io/component_measures?id=iojka_grand-cinema-front&metric=coverage&view=list) [![Sécurité](https://sonarcloud.io/api/project_badges/measure?project=iojka_grand-cinema-front&metric=security_rating)](https://sonarcloud.io/component_measures?id=iojka_grand-cinema-front&metric=security_rating&view=list)

Interface web de l'application de réservation de places pour "Le Grand Cinéma" : 10 salles et 1 700 places

L'objectif du projet est d'augmenter la fréquentation de 30% en 12 mois, surtout pendant le festival de jazz. 
L'application dessert cet objectif en permettant de consulter le programme, voir les places disponibles en temps réel, réserver sa ou ses places, payer en ligne et recevoir un billet dématérialisé. Côté cinéma, elle permet de gérer la programmation, suivre les réservation et analyser le remplissages des salles notamment. Pour plus de détail cf. documents de conception et de gestion de l'app (blocs 1 et 2)

Liens du projet : 
- Dépôt back end (API Django) : https://github.com/iojka/grand-cinema-back
- Product Backlog : https://trello.com/b/Z7q5iFj3/le-grand-cinema-product-backlog-by-marine
- Application (préproduction) : https://brave-meadow-061c73103.4.azurestaticapps.net
- Documentation de l'API (Swagger) : https://ca-grandcinema-preprod-fr.niceriver-d1b5328b.francecentral.azurecontainerapps.io/api/docs/
- Qualité du code (SonarQube Cloud) : https://sonarcloud.io/summary/overall?id=iojka_grand-cinema-front&branch=develop

Premier chargement : 20 à 30 secondes possibles (l'API s'arrête sans visite pour limiter le coût).

## Périmètre

Ce dépôt contient le MVP défini avec la méthode MoSCoW (US avec "Must") du backlog Trello.

Exigences transverses : affichage responsive adapté au mobile, interface en français et en anglais, sécurité et RGPD.

## Socle technique : 
- React : interface en composants réutilisables, adaptée au plan de salle interactif
- API REST du dépôt back end (échanges json)
- Stripe : redirection vers la page de paiement hébergée
- MS Azure Static Web Apps : hébergement des fichiers statiques, diffusés par le réseau de diffusion (CDN) d'Azure
- ESLint et Prettier : qualité et formatage du code
- GitHub Actions : intégration et livraison continues

## Organisation des branches

cf. CONTRIBUTING.md

## Tests et qualité du code

- Tests : Vitest et Testing Library (93 tests), écrits avant le code (TDD)
- Couverture : `npm run test:coverage` (87 %)
- Analyse et formatage : `npm run lint` (ESLint) et `npm run format:check` (Prettier)
- Intégration continue (GitHub Actions) : ESLint, Prettier, tests et couverture, construction, puis SonarQube Cloud (quality gate sur chaque PR)
- Livraison continue : déploiement sur Azure Static Web Apps à chaque fusion sur develop

## Auteur

Marine Crognier (Bachelor Développeur d'application Python, Bloc 3 "Développer une solution digitale") - session décembre 2026