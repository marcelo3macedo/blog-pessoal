---
title: "Water Drink: funcionamento detalhado do app de hidratação diária"
category: estudos-de-caso-adrs
difficulty: Iniciante
project: water-drink
excerpt: "Detalhes de onboarding, tela inicial, metas por exercício, favoritos, conquistas, notificações, configurações, acompanhamento e widget Android do app Water Drink (Hidratação Diária)."
slug: water-drink-funcionamento-detalhado
published_at: 2026-07-24
tags:
  - react-native
  - expo
  - notificacoes
  - widget
  - android
seo_title: "Water Drink: funcionamento detalhado do app de hidratação diária"
seo_description: "Entenda em detalhes como funciona o Water Drink: onboarding personalizado, cálculo de meta, aumento de meta por exercício, favoritos, conquistas, notificações e widget Android."
seo_keywords:
  - react native
  - expo
  - hidratacao
  - notificacoes
  - widget android
---

No [post anterior](/posts/water-drink-app-hidratacao-diaria) apresentei o **Water Drink**, projeto [Hidratação Diária](/projetos/water-drink), um app mobile em **React Native + Expo** para acompanhar a ingestão de água ao longo do dia. Neste artigo entro em detalhes sobre cada funcionalidade, com base no [README do projeto](https://github.com/marcelo3macedo/water-drink).

Código-fonte completo em: https://github.com/marcelo3macedo/water-drink

---

## Onboarding personalizado

O primeiro contato do usuário com o app é um questionário curto:

- Perguntas rápidas sobre sexo, faixa etária e peso (peso é opcional);
- Cálculo automático de uma meta diária de água recomendada, com opção de ajuste manual;
- Seleção dos recipientes (copos, garrafas, squeezes) favoritos para uso no dia a dia;
- Opção de pular o questionário e informar a meta manualmente.

![[waterdrink-boas-vindas.png|Boas-vindas]]

![[waterdrink-sexo.png|Sexo]]

![[waterdrink-faixa-etaria.png|Faixa etária]]

![[waterdrink-peso.png|Peso]]

![[waterdrink-meta-recomendada.png|Meta recomendada]]

![[waterdrink-conclusao-onboarding.png|Conclusão do onboarding]]

---

## Tela inicial

- Indicador circular com o percentual e volume já consumido no dia;
- Meta diária exibida em destaque;
- Botões de ação rápida para registrar volumes predefinidos com um toque;
- Botão **+ Personalizado** para informar qualquer quantidade manualmente;
- Botão **Fiz exercício** para aumentar a meta apenas do dia atual, repondo o líquido perdido no treino.

![[waterdrink-tela-inicial.png]]

---

## Aumentar meta por exercício

Depois de treinar, o usuário pode repor o líquido perdido sem alterar a meta dos outros dias:

- Valores rápidos recomendados para corrida (leve, moderada, intensa) e academia (leve, moderada, intensa);
- Campo para informar um valor de reposição personalizado;
- Ajuste vale **somente para o dia atual** — a meta volta ao normal no dia seguinte;
- Indicador na tela inicial mostrando o quanto a meta foi aumentada.

![[waterdrink-exercicio.png]]

---

## Favoritos

- Lista completa de recipientes (copos, garrafas, squeezes, jarras) para marcar como favoritos;
- Favoritos aparecem como atalhos na tela inicial e no widget;
- Criação de medidas personalizadas com ícone e volume próprios.

![[waterdrink-recipientes-favoritos.png]]

---

## Conquistas

- Sistema de troféus que gamifica o uso do app (registros, metas batidas, sequências por dia da semana, entre outras);
- Tela dedicada com o progresso de conquistas desbloqueadas;
- Campo opcional de aniversário para desbloquear a conquista especial "Brinde à Vida".

![[waterdrink-conquistas.png]]

---

## Notificações

- Central de notificações com lembretes de hidratação e conquistas desbloqueadas;
- Alerta ao **meio-dia** caso o usuário esteja abaixo de 50% da meta;
- Alerta à **tarde (18h)** caso a meta ainda não tenha sido atingida;
- Botão para testar a notificação imediatamente;
- Compartilhamento de conquistas desbloqueadas como imagem.

![[waterdrink-lembretes.png|Lembretes]]

![[waterdrink-notificacoes.png|Central de notificações]]

---

## Configurações

- Definição da meta diária de água (opções rápidas: 1500, 2000, 2500 ou 3000 ml);
- Inserção manual de uma meta personalizada;
- Gerenciamento dos botões de ação rápida — ideal para quem usa um copo ou garrafa de volume fixo.

![[waterdrink-configuracoes.png]]

---

## Acompanhamento

- Histórico do dia com cada lançamento e o horário exato em que foi registrado;
- Indicação visual de quanto ainda falta para completar a meta;
- Opção de remover lançamentos individuais ou zerar o dia;
- Registros **reiniciados automaticamente** a cada novo dia.

![[waterdrink-acompanhamento.png]]

---

## Widget Android

- Widget para a tela inicial do celular com o progresso do dia e acesso rápido aos recipientes favoritos;
- Adição de água diretamente pelo widget, sem precisar abrir o app.

![[waterdrink-widget.png]]

---

## Tecnologias

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (~54);
- [React Navigation](https://reactnavigation.org/) — navegação em abas e pilha;
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) — lembretes locais agendados;
- [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) — persistência local dos dados;
- [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) — gradientes de interface;
- [react-native-svg](https://github.com/software-mansion/react-native-svg) — indicador circular de progresso;
- [react-native-android-widget](https://github.com/sAleksovski/react-native-android-widget) — widget de hidratação na tela inicial do Android;
- [react-native-view-shot](https://github.com/gre-hub/react-native-view-shot) + [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) — compartilhamento de conquistas como imagem.

## Como executar

```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npx expo start
```

Para testar notificações e o widget é necessário usar um **Development Build** em vez do Expo Go:

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

Código completo disponível em [github.com/marcelo3macedo/water-drink](https://github.com/marcelo3macedo/water-drink).
