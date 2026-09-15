---
tags: iot, fhir, hl7, fastapi, nextjs, e-sante, websockets, logstash
title: "Construire une plateforme IoT de santé conforme FHIR/HL7 : du capteur au temps réel"
date: 2026-09-15
categories: [IoT & Santé, Architecture, FastAPI, DevOps]
excerpt: "Comment collecter des métriques physiologiques (Withings, EmotiBit, ESP32), les sérialiser aux normes médicales FHIR/HL7 et les restituer en temps réel sans sacrifier la sécurité."
lang: fr
---

# Construire une plateforme IoT de santé conforme FHIR/HL7 : du capteur au temps réel

*Dans le domaine de l'e-Santé et de la santé connectée, la collecte de données physiologiques pose un double défi : traiter des flux d'événements à haute fréquence tout en garantissant la conformité stricte aux standards d'interopérabilité médicale (FHIR / HL7) et aux exigences de confidentialité des données de santé.*

---

## Le paysage de l'IoT médical : Hétérogénéité et contraintes

Les dispositifs de santé connectés modernes sont extrêmement variés :
- **Objets connectés du commerce** (ex: balances, tensiomètres ou montres via l'API Cloud Withings).
- **Capteurs biométriques haute fréquence** (ex: EmotiBit pour l'activité électrodermale et la photopléthysmographie).
- **Microcontrôleurs embarqués** (ESP32 / Arduino pour l'acquisition sur mesure en BLE / Wi-Fi).

Traiter ces données brutes et les envoyer directement dans une base de données relationnelle classique est une erreur d'architecture courante qui mène rapidement à l'engorgement du système.

---

## L'Architecture de référence : Du capteur au tableau de bord médical

```
┌─────────────────┐
│ Capteurs IoT    │  (BLE / Wi-Fi)
│ ESP32 / Withings│ ────────┐
└─────────────────┘         │
                            ▼
┌────────────────────────────────────────────────────────┐
│  Couche d'Acquisition & Broker d'événements            │
│  (FastAPI + WebSockets + Kafka / Logstash)             │
└───────────────────────────┬────────────────────────────┘
                            │ (Normalisation FHIR / HL7)
                            ▼
┌────────────────────────────────────────────────────────┐
│  Bases de Données & Moteur Vectoriel / Observabilité   │
│  (PostgreSQL / CouchDB + SigNoz + ELK Stack)           │
└───────────────────────────┬────────────────────────────┘
                            │ (Restitution Temps Réel)
                            ▼
┌────────────────────────────────────────────────────────┐
│  Interface Praticien & Patient (Next.js / Mantine UI)   │
└────────────────────────────────────────────────────────┘
```

---

## 1. L'Ingestion & Normalisation aux normes FHIR / HL7

Les données brutes issues des capteurs (ex: une fréquence cardiaque de `72 bpm` à un instant `t`) ne peuvent pas être stockées sous un format propriétaire. Elles doivent être transformées en **Ressources FHIR** (Fast Healthcare Interoperability Resources) de type `Observation`.

Exemple de payload FHIR généré :
```json
{
  "resourceType": "Observation",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "vital-signs",
          "display": "Vital Signs"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "8867-4",
        "display": "Heart rate"
      }
    ]
  },
  "valueQuantity": {
    "value": 72,
    "unit": "beats/min",
    "system": "http://unitsofmeasure.org",
    "code": "/min"
  },
  "effectiveDateTime": "2026-09-15T10:30:00Z"
}
```

Cette normalisation garantit que les données collectées pourront être transmises ou intégrées directement dans les systèmes d'information hospitaliers (DPI) de n'importe quel établissement de santé.

---

## 2. Restitution Temps Réel et Observabilité

Pour permettre aux praticiens de suivre l'évolution d'un patient en temps réel lors d'une session de collecte :
- **FastAPI + WebSockets** assure la diffusion d'événements à faible latence vers le frontend Next.js.
- **Logstash & Kafka** absorbent les pics de charge sans bloquer le fil d'exécution.
- **SigNoz & Prometheus** supervisent l'état de la plateforme, garantissant qu'aucune perte de paquet n'intervienne pendant l'acquisition biométrique.

---

## 3. Sécurité et traçabilité des données de santé

La santé connectée impose une rigueur absolue :
1. **Chiffrement de bout en bout** : TLS 1.3 en transit, chiffrement AES-256 au repos.
2. **Cloisonnement des identités (RBAC)** : Séparation stricte entre données d'identification du patient (PII) et métriques physiologiques anonymisées.
3. **Traçabilité des accès** : Audit log inaltérable enregistrant chaque consultation médicale.

---

## Conclusion

Concevoir une plateforme IoT de santé moderne ne consiste pas simplement à connecter un capteur à une application mobile. C'est l'art d'associer **l'ingénierie temps réel**, la **rigueur des standards médicaux (FHIR/HL7)** et l'**observabilité des systèmes distribués** pour offrir aux médecins un outil fiable et sécurisé.
