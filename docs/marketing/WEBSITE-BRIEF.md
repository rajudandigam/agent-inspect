# AgentInspect Website Brief

## Goal

Create a low-cost adoption website for AgentInspect.

## Audience

TypeScript/Node.js developers building AI agents.

## Primary message

Debug TypeScript AI agents locally. Trace what happened, check what should have happened, and redact what must not leave your machine.

## Product boundary

AgentInspect is local-first trace + check + redact for TypeScript AI agents.

## What the website should drive

- npm install
- GitHub visit/star
- first trace docs
- safe trace sharing docs
- docs route exploration
- contributor interest

## Non-goals

- hosted dashboard
- SaaS signup
- production APM
- hidden telemetry
- database
- auth
- full docs migration in this first pass
- separate website repo

## Hosting

- Vercel first
- Root Directory: apps/website
- Static export preferred
- Cloudflare Pages/Netlify/GitHub Pages compatible later

## Deployment model

The library stays published from the root/package workspace.
The website is private and deployed from apps/website.
