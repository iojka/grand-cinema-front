# grand-cinema-front
Interface web de l'application de réservation de places pour "Le Grand Cinéma" : 10 salles et 1 700 places

L'objectif du projet est d'augmenter la fréquentation de 30% en 12 mois, surtout pendant le festival de jazz. 
L'application dessert cet objectif en permettant de consulter le programme, voir les places disponibles en temps réel, réserver sa ou ses places, payer en ligne et recevoir un billet dématérialisé. Côté cinéma, elle permet de gérer la programmation, suivre les réservation et analyser le remplissages des salles notamment. Pour plus de détail cf. documents de conception et de gestion de l'app (blocs 1 et 2)

Liens du projet : 
- Dépôt back end (API Django) : https://github.com/iojka/grand-cinema-back
- Product Backlog : https://trello.com/b/Z7q5iFj3/le-grand-cinema-product-backlog-by-marine
- Application : en cours
- Documentation de l'API : en cours

## Périmètre

Ce dépôt contient le MVP défini avec la méthode MoSCoW (US avec "Must") du backlog Trello.

Exigences transverses : affichage responsive adapté au mobile, interface en français et en anglais, sécurité et RGPD.

## Socle technique : 
- React : interface en composants réutilisables, adaptée au plan de salle interactif
- API REST du dépôt back end (échanges json)
- Stripe : redirection vers la page de paiement hébergée
- MS Azure Static Web Apps : hébergement des fichiers statiques avec Cloudflare en CDN
- ESLint et Prettier : qualité et formatage du code
- GitHub actions : intégration continue

## Organisation des branches

cf. CONTRIBUTING.md

## Tests et qualité du code

En cours

## Auteur

Marine Crognier (Bachelor Développeur d'application Python, Bloc 3 "Développer une solution digitale") - session décembre 2026