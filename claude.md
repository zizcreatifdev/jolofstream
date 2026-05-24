# Règles absolues — Claude Code

## Règles de développement

Règle 1 — Chaque fonctionnalité demandée = implémentée à 100%. Aucun placeholder. Aucun composant vide. Aucun bouton désactivé sans raison fonctionnelle réelle.

Règle 2 — Cohérence UI et serveur totale. Chaque action UI a une route API. Chaque route API a une UI. Aucune route orpheline. Aucun bouton sans action.

Règle 3 — Si un fichier doit être modifié pour que la fonctionnalité fonctionne, le modifier dans le même prompt. Jamais de "à faire dans un prompt suivant" si c'est nécessaire maintenant.

Règle 4 — npm run build doit passer sans erreur avant chaque commit. Zéro warning bloquant.

Règle 5 — Aucun emoji dans le code. Framer Motion uniquement pour les animations. Zéro tiret long dans le code.

Règle 6 — En cas de doute ou de décision non couverte par le cahier des charges ou les fichiers mémoire, s'arrêter et signaler. Ne jamais inventer.

Règle 7 — git add . && git commit puis git push origin main après chaque prompt complété.

## Protocole à respecter à chaque prompt (ordre strict)

1. git add . && git commit -m "snapshot avant prompt-XX"
2. Lire les 4 fichiers mémoire et confirmer en listant 3 points clés retenus de chacun. Ne pas coder avant cette confirmation.
3. Exécuter la tâche demandée.
4. npm run build — confirmer que le build passe sans erreur.
5. Cocher chaque point de la checklist de validation du prompt.
6. Mettre à jour project_state.md.
7. git add . && git commit -m "prompt-XX : description précise"
8. git push origin main
9. En cas de problème bloquant — git revert HEAD et signaler immédiatement.

## Rapport obligatoire après chaque prompt

- Confirmer chaque point implémenté avec une ligne par point
- Signaler tout problème rencontré avec la solution appliquée
- Donner le SQL à exécuter si des tables ou politiques ont été créées ou modifiées
- Lister les ambiguïtés ou décisions prises en cours d'exécution
- Ne jamais passer au prompt suivant sans avoir soumis ce rapport et reçu le Go

## gstack

gstack (v1.44.0.0) est installe dans `~/.claude/skills/gstack`.

- Utiliser `/browse` pour toute navigation web et QA visuelle (ouvrir une page,
  verifier un deploiement, dogfooder un flux, capturer des screenshots de bug).
- Note : le binaire Chromium de Playwright n'a pas pu etre telecharge dans le
  conteneur (cdn.playwright.dev hors allowlist). `/browse` et les skills de QA
  navigateur ne fonctionneront qu'une fois Chromium disponible (allowlist reseau
  ou Chromium systeme), en local ou sur un environnement non restreint.

Skills disponibles :
/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship,
/land-and-deploy, /canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only,
/design-review, /setup-browser-cookies, /setup-deploy, /retro, /investigate,
/document-release, /document-generate, /codex, /cso, /autoplan, /careful,
/freeze, /guard, /unfreeze, /gstack-upgrade, /learn
