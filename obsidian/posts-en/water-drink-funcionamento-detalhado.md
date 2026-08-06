---
title: "Water Drink: a detailed look at how the hydration tracking app works"
category: estudos-de-caso-adrs
difficulty: Beginner
project: water-drink
excerpt: "Details on onboarding, home screen, exercise-based goal boosts, favorites, achievements, notifications, settings, tracking, and the Android widget of the Water Drink (Hidratação Diária) app."
slug: water-drink-how-it-works-in-detail
published_at: 2026-07-24
tags:
  - react-native
  - expo
  - notifications
  - widget
  - android
seo_title: "Water Drink: a detailed look at how the hydration tracking app works"
seo_description: "A detailed look at how Water Drink works: personalized onboarding, goal calculation, exercise-based goal boosts, favorites, achievements, notifications, and Android widget."
seo_keywords:
  - react native
  - expo
  - hydration
  - notifications
  - android widget
---

In the [previous post](/posts/water-drink-hydration-tracking-app) I introduced **Water Drink**, the [Hidratação Diária](/projetos/water-drink) project, a mobile app built with **React Native + Expo** to track water intake throughout the day. In this article I go into detail on each feature, based on the [project's README](https://github.com/marcelo3macedo/water-drink).

Full source code at: https://github.com/marcelo3macedo/water-drink

---

## Personalized onboarding

The user's first contact with the app is a short questionnaire:

- Quick questions about sex, age range, and weight (weight is optional);
- Automatic calculation of a recommended daily water goal, with the option to adjust it manually;
- Selection of favorite containers (cups, bottles, squeeze bottles) for everyday use;
- Option to skip the questionnaire and set the goal manually.

![[waterdrink-boas-vindas.png|Welcome]]

![[waterdrink-sexo.png|Sex]]

![[waterdrink-faixa-etaria.png|Age range]]

![[waterdrink-peso.png|Weight]]

![[waterdrink-meta-recomendada.png|Recommended goal]]

![[waterdrink-conclusao-onboarding.png|Onboarding complete]]

---

## Home screen

- Circular indicator with the percentage and volume already consumed for the day;
- Daily goal shown front and center;
- Quick-action buttons to log preset volumes with a single tap;
- **+ Custom** button to enter any amount manually;
- **I exercised** button to boost the goal for the current day only, replenishing fluids lost during the workout.

![[waterdrink-tela-inicial.png]]

---

## Exercise-based goal boost

After a workout, the user can replenish lost fluids without changing the goal on other days:

- Quick recommended values for running (light, moderate, intense) and gym workouts (light, moderate, intense);
- Field to enter a custom replenishment amount;
- The adjustment applies **only to the current day** — the goal returns to normal the next day;
- Indicator on the home screen showing how much the goal was boosted.

![[waterdrink-exercicio.png]]

---

## Favorites

- Full list of containers (cups, bottles, squeeze bottles, jugs) to mark as favorites;
- Favorites show up as shortcuts on the home screen and in the widget;
- Creation of custom measurements with their own icon and volume.

![[waterdrink-recipientes-favoritos.png]]

---

## Achievements

- Trophy system that gamifies app usage (logging, goals reached, weekly streaks, among others);
- Dedicated screen showing progress on unlocked achievements;
- Optional birthday field to unlock the special "Toast to Life" achievement.

![[waterdrink-conquistas.png]]

---

## Notifications

- Notification center with hydration reminders and unlocked achievements;
- Alert at **noon** if the user is below 50% of the goal;
- Alert in the **afternoon (6pm)** if the goal still hasn't been reached;
- Button to test the notification immediately;
- Sharing unlocked achievements as an image.

![[waterdrink-lembretes.png|Reminders]]

![[waterdrink-notificacoes.png|Notification center]]

---

## Settings

- Setting the daily water goal (quick options: 1500, 2000, 2500, or 3000 ml);
- Manually entering a custom goal;
- Managing the quick-action buttons — ideal for people using a fixed-volume cup or bottle.

![[waterdrink-configuracoes.png]]

---

## Tracking

- Daily history with every log entry and the exact time it was recorded;
- Visual indication of how much is left to reach the goal;
- Option to remove individual entries or reset the day;
- Entries **automatically reset** every new day.

![[waterdrink-acompanhamento.png]]

---

## Android widget

- Home-screen widget showing the day's progress and quick access to favorite containers;
- Adding water directly from the widget, without opening the app.

![[waterdrink-widget.png]]

---

## Technologies

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (~54);
- [React Navigation](https://reactnavigation.org/) — tab and stack navigation;
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) — scheduled local reminders;
- [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) — local data persistence;
- [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) — UI gradients;
- [react-native-svg](https://github.com/software-mansion/react-native-svg) — circular progress indicator;
- [react-native-android-widget](https://github.com/sAleksovski/react-native-android-widget) — hydration widget on the Android home screen;
- [react-native-view-shot](https://github.com/gre-hub/react-native-view-shot) + [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) — sharing achievements as an image.

## How to run it

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

Testing notifications and the widget requires a **Development Build** instead of Expo Go:

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

Full source code available at [github.com/marcelo3macedo/water-drink](https://github.com/marcelo3macedo/water-drink).
