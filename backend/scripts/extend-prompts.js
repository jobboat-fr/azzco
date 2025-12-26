// Script pour étendre les prompts avec plus d'exemples
// Ce script peut être utilisé pour générer des exemples supplémentaires

const fs = require('fs');
const path = require('path');

const promptsDir = path.join(__dirname, '../prompts');

// Templates d'exemples supplémentaires pour chaque catégorie
const additionalExamples = {
    general: [
        {
            question: "Quelle est l'histoire d'AZZ&CO LABS ?",
            answer: "AZZ&CO LABS a été fondée avec une vision claire : utiliser la technologie pour améliorer la vie des gens, pas pour les remplacer. Nous avons commencé par développer JobBoat, une solution pour transformer la recherche d'emploi, et nous travaillons maintenant sur OutWings pour révolutionner les sorties de groupes. Notre histoire est celle d'une entreprise qui croit en l'innovation éthique et centrée sur l'humain."
        },
        {
            question: "Combien de personnes travaillent chez AZZ&CO LABS ?",
            answer: "AZZ&CO LABS est actuellement une équipe en croissance. Nous sommes en phase de préparation légale et administrative, ce qui signifie que nous structurons notre organisation pour le lancement. Pour des informations précises sur notre équipe et nos opportunités de recrutement, n'hésitez pas à nous contacter directement."
        },
        {
            question: "Quels sont vos objectifs pour les 5 prochaines années ?",
            answer: "Nos objectifs sont ambitieux mais réalistes. Nous visons à lancer JobBoat et OutWings avec succès, à construire une communauté active d'utilisateurs, et à établir AZZ&CO LABS comme un leader dans l'innovation technologique éthique. Nous voulons démontrer qu'il est possible de créer de la valeur tout en respectant les valeurs humaines."
        }
        // Ajouter plus d'exemples ici...
    ],
    contact: [
        {
            question: "Quels sont vos horaires d'ouverture ?",
            answer: "Nous sommes disponibles du lundi au vendredi de 9h à 18h (heure de Paris). Pour les demandes urgentes, vous pouvez nous laisser un message et nous vous répondrons dans les plus brefs délais. Nous nous efforçons de répondre à toutes les demandes dans les 24-48 heures."
        }
        // Ajouter plus d'exemples...
    ]
    // Ajouter d'autres catégories...
};

console.log("Script d'extension des prompts créé. Utilisez ce script pour ajouter des exemples supplémentaires aux fichiers de prompts.");
