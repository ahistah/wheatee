# Wheaty Privacy Policy Draft

Last updated: 2026-06-05

This draft must be reviewed by the app operator and legal counsel before publication. Replace bracketed placeholders before linking it in Play Console.

## Operator

Wheaty is operated by `[Legal entity name]`.

Contact: `[support email]`

## What Wheaty Does

Wheaty helps wheat farmers save farm profiles, map farm boundaries, diagnose crop symptoms from images, ask text or voice farming questions, and review saved farm memory.

## Data We Collect

Wheaty may collect and process:

- Account data: email address, Firebase user identifier, authentication tokens, and selected app language.
- Farm profile data: farm size, crop types, soil type, irrigation type, location text, mapped boundary GeoJSON, center coordinates, hectares, and kanal.
- Crop diagnosis data: crop images, image metadata, symptom notes, diagnosis results, confidence scores, symptoms, treatment steps, and recommendations.
- Voice question data: microphone recordings or encoded audio, speech transcripts, text edits, and voice advice results.
- Chat and planning data: farmer questions, AI responses, intent labels, action items, and saved history records.
- Technical data: backend reachability/status, request timestamps, error information, and service logs required to operate and secure the app.

Wheaty does not request device GPS location in the current release. Farm mapping is created manually by tapping field points on the map.

## How We Use Data

We use data to:

- Authenticate farmers and protect account access.
- Save and retrieve farm profiles and farm memory.
- Diagnose crop symptoms and generate farming advice.
- Transcribe voice questions.
- Store crop images needed for diagnosis workflows.
- Improve reliability, security, abuse prevention, and support.

## Services Used

Wheaty uses these production services:

- Firebase Authentication for sign-in and identity verification.
- Google Cloud Run for the backend API.
- Supabase Postgres for farm profiles, history, and knowledge records.
- Vertex AI/Gemini for crop diagnosis and agronomy advice.
- Google Cloud Speech-to-Text for voice transcription.
- Google Cloud Storage for crop image storage.
- Mapbox for farm mapping.

The mobile app sends authenticated requests to the Wheaty backend. The mobile app does not use the Supabase service role key directly.

## Sharing

We do not sell farmer data. Data is shared with the service providers listed above only as needed to provide Wheaty features, operate the backend, store records, generate AI responses, transcribe voice, and display maps.

We may disclose data if required by law, to protect users or the service, or as part of a business transfer involving the app operator.

## Retention

Farm profiles, mapped boundaries, diagnoses, conversations, and planning history are retained until the farmer or app operator deletes them, or until retention is no longer required to provide the service.

Operational logs are retained according to the app operator's cloud logging and security policies.

## Security

Wheaty uses HTTPS for network requests. Farmer records are tied to the Firebase-authenticated `userId`, and backend authorization checks prevent one authenticated farmer from accessing another farmer's records.

No system can guarantee perfect security. Farmers should avoid submitting unnecessary personal or sensitive information in crop notes, voice recordings, or chat questions.

## Farmer Choices

Farmers can:

- Choose not to grant camera, photo library, or microphone permissions.
- Edit or omit optional notes before submitting a diagnosis or voice question.
- Delete farm profile, mapped boundary, diagnosis history, saved advice, and local farm cache from the Profile screen.
- Sign out from the app.
- Request account or farm data deletion by contacting `[support email]`.

## Children

Wheaty is intended for farmers and agricultural operators. It is not directed to children.

## Changes

The app operator may update this policy as Wheaty changes. The updated policy should be published before distributing a build that changes data collection, sharing, or permissions.

## Contact

Questions or deletion requests: `[support email]`
