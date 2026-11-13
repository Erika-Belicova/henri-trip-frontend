# Henri Trip (front-end)

**Henri Trip** est une application de gestion de guides touristiques permettant aux administrateurs de créer et gérer des guides, d'organiser des activités au sein d'itinéraires journaliers et d'inviter des utilisateurs à consulter leurs guides. Les utilisateurs peuvent parcourir les guides auxquels ils ont accès et consulter leurs itinéraires ainsi que les détails des activités.

Ce dépôt contient la partie **front-end** de l'application, développée avec **Angular 21** et **TypeScript**, en utilisant des composants autonomes (standalone components), des formulaires réactifs (**Reactive Forms**) et **Angular CDK** pour la gestion du glisser-déposer (drag and drop) des activités.

L'application communique avec une **API REST** développée avec **Spring Boot** et sécurisée par **authentification JWT**. Elle propose des interfaces distinctes pour les administrateurs et les utilisateurs, grâce à un système de gestion des rôles.

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Cloner le dépôt](#2-cloner-le-dépôt)
3. [Installation et configuration](#3-installation-et-configuration)
4. [Lancement de l'application](#4-lancement-de-lapplication)
5. [Fonctionnalités](#5-fonctionnalités)

---

## 1. Prérequis

Les outils suivants sont nécessaires :

- **Node.js 24**
- **npm 11**
- **Angular CLI 21**  
- **Git**
- **Docker Desktop** (pour exécuter l'application complète)

Le **back-end Spring Boot** et la base de données **PostgreSQL** doivent également être démarrés pour que l'application fonctionne correctement.

La base de données est exécutée avec **Docker Compose** et utilise **PostgreSQL 18.6**. Consultez le README du dépôt back-end pour les instructions concernant la configuration et l'initialisation de la base de données.

## 2. Cloner le dépôt

Ouvrez un terminal et exécutez les commandes suivantes :
```
git clone https://github.com/Erika-Belicova/henri-trip-frontend.git

cd henri-trip-frontend
```

## 3. Installation et configuration

Installez les dépendances du projet :
```
npm install
```

### Configuration de l'API

L'application utilise un proxy de développement Angular pour communiquer avec le back-end.

L'environnement de développement (```src/environments/environment.development.ts```) définit l'URL de base de l'API :
```typescript
export const environment = {
  production: false,
  apiUrl: '/api'
};
```
La configuration du proxy (proxy.conf.json) redirige les requêtes API vers le back-end Spring Boot :  
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```
Le proxy est déjà configuré dans angular.json. Aucune configuration supplémentaire en ligne de commande n'est nécessaire.

## 4. Lancement de l'application

Avant de démarrer le front-end, assurez-vous que :

* **Docker Desktop** est démarré.
* La base de données **PostgreSQL** a été lancée avec **Docker Compose**.
* Le back-end **Spring Boot** est démarré et accessible sur le `port 8080`.
* Consultez le **README** du dépôt back-end pour les instructions correspondantes.

Démarrez le serveur de développement Angular :
```
npm start
```
L'application sera accessible à l'adresse suivante :
```
http://localhost:4200
```
Les **requêtes API** sont automatiquement redirigées vers le **back-end** grâce au proxy de développement.

## 5. Fonctionnalités

#### 1. Authentification

* Formulaire de connexion avec authentification JWT.
* Gestion des sessions et validation des jetons.
* Redirection automatique selon le rôle de l'utilisateur.
* Protection des routes avec des guards d'authentification, d'accès invité et d'administration.
* Gestion des jetons et des erreurs d'authentification via des intercepteurs HTTP.

#### 2. Interface administrateur

* Tableau de bord et interfaces de gestion des guides.
* Gestion des activités et organisation des itinéraires journaliers.
* Réorganisation des activités par glisser-déposer, y compris entre différentes journées.
* Formulaires réactifs avec validation et modales de confirmation pour les suppressions.
* Gestion des utilisateurs et des invitations aux guides.

#### 3. Interface utilisateur

* Consultation des guides accessibles à l'utilisateur connecté.
* Consultation des détails des guides, de leurs descriptions et de leurs itinéraires journaliers.
* Consultation des activités et de leurs informations pratiques.

#### 4. Fonctionnalités générales

* Navigation par rôle et chargement différé des composants (lazy loading).
* Page personnalisée pour les erreurs 404.
* Gestion des échanges asynchrones avec RxJS et les Observables.
* Mise à jour réactive de l'interface après les opérations.

---

Pour les instructions concernant la configuration du back-end, l'initialisation de la base de données et la documentation de l'API, consultez le dépôt back-end de Henri Trip.
