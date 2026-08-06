---
title: "Water Drink: an app to track your daily water intake"
category: estudos-de-caso-adrs
difficulty: Beginner
project: water-drink
excerpt: "Water Drink (Hidratação Diária) is a mobile app built with React Native and Expo to log water intake, calculate personalized goals, and remind users to stay hydrated."
slug: water-drink-hydration-tracking-app
published_at: 2026-07-24
tags:
  - react-native
  - expo
  - mobile
  - productivity
  - health
seo_title: "Water Drink: a mobile app to track your daily water intake"
seo_description: "Meet Water Drink (Hidratação Diária), a React Native + Expo app to log water intake, with personalized onboarding, goals, achievements, reminders, and an Android widget."
seo_keywords:
  - react native
  - expo
  - hydration
  - mobile app
  - water drink
---

# Water Drink: an app to track your daily water intake

**Water Drink** (internal name "Hidratação Diária") is a mobile app I built with **React Native and Expo** to log and track water intake throughout the day, helping to reach a daily hydration goal.

![[waterdrink-boas-vindas.png|Welcome screen]]

The idea came from a simple, personal problem: remembering to drink water throughout the day without relying on manual notes or doing the math in your head.

## Personalized onboarding

The first time the app is opened, the user goes through a quick questionnaire — sex, age range, and weight (optional) — used to automatically calculate a **recommended daily goal**, which can also be adjusted manually.

![[waterdrink-recipientes-favoritos.png|Favorite containers]]

At this same stage, the user can already choose the favorite containers (cups, bottles, squeeze bottles) that will show up as shortcuts for everyday use.

## Home screen

The main screen shows a circular indicator with the percentage and volume already consumed, the goal front and center, and quick-action buttons to log preset volumes with a single tap — plus a **+ Custom** button for specific amounts.

![[waterdrink-tela-inicial.png|Home screen]]

## Achievements and widget

A trophy system gamifies app usage (logging, goals reached, weekly streaks), and an **Android widget** lets you log water straight from the phone's home screen, without opening the app.

![[waterdrink-widget.png|Home screen widget]]

## Stack

The project uses **React Native + Expo**, **React Navigation**, `expo-notifications` for scheduled local reminders, `AsyncStorage` for local data persistence, and `react-native-android-widget` for the Android widget.

For a detailed look at each feature, check out the [Water Drink deep-dive post](/posts/water-drink-how-it-works-in-detail) or the [source code on GitHub](https://github.com/marcelo3macedo/water-drink).
