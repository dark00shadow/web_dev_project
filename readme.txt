# Equinox Store - Site E-commerce

Description du site
------------------
Equinox Store est un mini site e-commerce développé en HTML, CSS et JavaScript pur (sans backend). 
Le site permet aux utilisateurs de parcourir un catalogue de vêtements, de filtrer les produits par 
catégorie, saison, taille et prix, d'ajouter des articles au panier, de passer des commandes et de 
consulter leur historique d'achats.

Fonctionnalités principales :
- Page d'accueil avec présentation des produits saisonniers
- Catalogue de produits avec filtrage dynamique côté client
- Système d'authentification simulé (inscription et connexion)
- Panier d'achat avec gestion des quantités
- Processus de commande avec formulaire de livraison
- Historique des commandes avec téléchargement de reçus PDF
- Interface responsive et thème sombre/clair
- Navigation par menu latéral sur toutes les pages

Instructions d'utilisation
---------------------------
1. Ouvrir le fichier index.html dans un navigateur web moderne
2. Naviguer sur le site en utilisant le menu principal ou le menu latéral
3. Pour parcourir les produits, cliquer sur "Catalog" dans le menu
4. Utiliser les filtres dans la barre latérale pour affiner la recherche
5. Cliquer sur un produit pour voir les détails
6. Ajouter des articles au panier en sélectionnant la taille et la quantité
7. Passer commande en remplissant le formulaire de livraison
8. Consulter l'historique des commandes dans la section "Receipts"
9. S'inscrire ou se connecter pour accéder aux fonctionnalités utilisateur

Authentification :
- Les utilisateurs peuvent s'inscrire avec un formulaire validé côté client
- Les identifiants sont vérifiés contre une base de données simulée (users-db.js)
- La session utilisateur est stockée dans localStorage
- Après inscription, l'utilisateur est automatiquement connecté

Membres du groupe
-----------------
- Outaleb Zahir
- Guerrab Said


Organisation du projet
----------------------
guerrab-said_outaleb-zahir/
│
├── index.html
├── content/ (les .html)
│   ├── products.html
│   ├── product-details.html
│   ├── cart.html
│   ├── checkout.html
│   ├── login.html
│   ├── register.html
│   └── orders.html
├── style/ (les .css)
│   ├── index.css
│   ├── products.css
│   ├── product-details.css
│   ├── cart.css
│   ├── checkout.css
│   ├── login.css
│   ├── register.css
│   ├── orders.css
│   └── mobile.css
├── javascript/ (les .js)
│   ├── common.js
│   ├── index.js
│   ├── products.js
│   ├── product-details.js
│   ├── cart.js
│   ├── checkout.js
│   ├── login.js
│   ├── register.js
│   ├── orders.js
│   ├── validation.js
│   ├── theme.js
│   └── users-db.js
├── images/
│   ├── accessories/
│   ├── bottoms/
│   ├── coats/
│   ├── dresses/
│   ├── tops/
│   └── ...
├── json/
│   ├── product.json
│   └── location.json
└── readme.txt
