# Supply Game - Guide d'Installation

Ce projet a été créé avec React et Vite. Pour que le projet fonctionne correctement après l'avoir récupéré depuis GitHub, il faut installer les dépendances (les "requirements") via Node.js.

Il n'y a pas besoin de créer un fichier "requirements.txt" comme en Python, car dans un projet React/Node.js, toutes les dépendances sont déjà listées dans le fichier `package.json`.

Voici les étapes exactes à suivre pour ton pote :

## 1. Prérequis
Il faut absolument avoir **Node.js** installé sur la machine.
- S'il ne l'a pas, vous poiuvez le télécharger et l'installer depuis le site officiel : [https://nodejs.org/](https://nodejs.org/) (prendre la version LTS).

## 2. Installation des dépendances ("requirements")
Une fois le projet récupéré et Node.js installé, vous deviez ouvrir un terminal (Invite de commandes, PowerShell ou le terminal de VS Code) et se placer dans le dossier du projet (`SupplyGame-React`).

Ensuite, vous deviez taper cette commande pour installer toutes les bibliothèques nécessaires (React, Tailwind, Three.js, Zustand, etc.) :
```bash
npm install
```
*(Cette commande va lire le fichier `package.json` et créer un dossier `node_modules` avec tout ce qu'il faut).*

## 3. Lancer l'application
Une fois l'installation terminée, pour démarrer l'application et la voir dans son navigateur, il doit taper :
```bash
npm run dev
```

Un lien va s'afficher dans le terminal (généralement `http://localhost:5174/` ou `http://localhost:5173/`). Il suffit de cliquer dessus ou de le copier dans son navigateur pour jouer !
