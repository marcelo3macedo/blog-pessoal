---
title: "Water Drink: aplicativo para acompanhar a hidratação diária"
category: projetos
difficulty: Iniciante
project: water-drink
project_description: "Aplicativo mobile em React Native (Expo) para registrar e acompanhar a ingestão de água ao longo do dia, com onboarding personalizado, lembretes, conquistas e widget para Android."
project_tags:
  - React Native
  - Expo
  - React Navigation
  - AsyncStorage
  - Android Widget
excerpt: "Water Drink (Hidratação Diária) é um app mobile feito em React Native com Expo para registrar a ingestão de água, calcular metas personalizadas e lembrar o usuário de se manter hidratado."
slug: water-drink-app-hidratacao-diaria
published_at: 2026-07-24
tags:
  - react-native
  - expo
  - mobile
  - produtividade
  - saude
seo_title: "Water Drink: aplicativo mobile para acompanhar a hidratação diária"
seo_description: "Conheça o Water Drink (Hidratação Diária), um app React Native + Expo para registrar a ingestão de água, com onboarding personalizado, metas, conquistas, lembretes e widget Android."
seo_keywords:
  - react native
  - expo
  - hidratacao
  - aplicativo mobile
  - water drink
---

# Water Drink: aplicativo para acompanhar a hidratação diária

O **Water Drink** (nome interno "Hidratação Diária") é um aplicativo mobile que desenvolvi em **React Native com Expo** para registrar e acompanhar a ingestão de água ao longo do dia, ajudando a manter uma meta diária de hidratação.

![[waterdrink-boas-vindas.png]]

A ideia surgiu de um problema simples e pessoal: lembrar de beber água ao longo do dia sem depender de anotações manuais ou cálculos feitos "de cabeça".

## Onboarding personalizado

Ao abrir o app pela primeira vez, o usuário passa por um questionário rápido — sexo, faixa etária e peso (opcional) — usado para calcular automaticamente uma **meta diária recomendada**, que também pode ser ajustada manualmente.

![[waterdrink-recipientes-favoritos.png]]

Nessa mesma etapa já é possível escolher os recipientes favoritos (copos, garrafas, squeezes) que vão aparecer como atalhos no dia a dia.

## Tela inicial

A tela principal mostra um indicador circular com o percentual e o volume já consumido, a meta em destaque e botões de ação rápida para registrar volumes predefinidos com um toque — além de um botão **+ Personalizado** para quantidades específicas.

![[waterdrink-tela-inicial.png]]

## Conquistas e widget

Um sistema de troféus gamifica o uso do app (registros, metas batidas, sequências por dia da semana), e um **widget Android** permite registrar água direto da tela inicial do celular, sem precisar abrir o app.

![[waterdrink-widget.png]]

## Stack

O projeto usa **React Native + Expo**, **React Navigation**, `expo-notifications` para lembretes locais, `AsyncStorage` para persistência local dos dados e `react-native-android-widget` para o widget Android.

Para o funcionamento detalhado de cada funcionalidade, veja o [post detalhado do Water Drink](/posts/water-drink-funcionamento-detalhado) ou o [código-fonte no GitHub](https://github.com/marcelo3macedo/water-drink).
