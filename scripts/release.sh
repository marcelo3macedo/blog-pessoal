#!/usr/bin/env bash
# Sincroniza posts do Obsidian, builda o projeto e empacota um zip de release
# pronto para produção, enviando-o por SSH para o servidor.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REMOTE_HOST="deploy@142.93.48.132"
REMOTE_DIR="~/blogpessoal-releases"

TIMESTAMP="$(date +%Y-%m-%d_%H%M%S)"
RELEASE_NAME="blogpessoal-${TIMESTAMP}"
RELEASES_DIR="$ROOT/releases"
RELEASE_ZIP="${RELEASES_DIR}/${RELEASE_NAME}.zip"

# O build precisa rodar na mesma versão major do Node do servidor de produção
# (v22.x). Módulos nativos como better-sqlite3 são compilados contra a ABI
# do Node usado no build — se divergir da ABI do servidor, o serviço quebra
# em produção com "Module did not self-register".
REQUIRED_NODE="$(cat "$ROOT/.nvmrc")"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  \. "$NVM_DIR/nvm.sh"
  if ! nvm ls "$REQUIRED_NODE" >/dev/null 2>&1; then
    echo "==> Instalando Node ${REQUIRED_NODE} via nvm (não encontrado localmente)"
    nvm install "$REQUIRED_NODE"
  fi
  nvm use "$REQUIRED_NODE" >/dev/null
fi

CURRENT_NODE="$(node --version | sed 's/^v//')"
if [ "$CURRENT_NODE" != "$REQUIRED_NODE" ]; then
  echo "ERRO: este script precisa do Node ${REQUIRED_NODE} (igual ao servidor), mas está rodando com ${CURRENT_NODE}."
  echo "Instale o nvm ou rode: nvm install ${REQUIRED_NODE} && nvm use ${REQUIRED_NODE}"
  exit 1
fi
echo "==> Usando Node ${CURRENT_NODE}"

echo "==> Sincronizando posts do Obsidian (blog.db)"
python3 sync_obsidian.py

echo "==> Instalando dependências"
pnpm install --frozen-lockfile

echo "==> Limpando build anterior (.next)"
rm -rf .next

echo "==> Buildando o projeto"
pnpm build

mkdir -p "$RELEASES_DIR"

STAGE_DIR="$(mktemp -d)"
trap 'rm -rf "$STAGE_DIR"' EXIT
PKG_DIR="$STAGE_DIR/$RELEASE_NAME"
mkdir -p "$PKG_DIR"

echo "==> Empacotando arquivos de produção (build standalone)"
cp -r .next "$PKG_DIR/.next"
rm -rf "$PKG_DIR/.next/cache"
cp -r public "$PKG_DIR/public"
cp blog.db "$PKG_DIR/"

# Empacota sem pasta-wrapper: o deploy-blog.sh do servidor descompacta
# direto em /var/www/blog (unzip -d $APP_DIR), então .next/ e public/
# precisam ficar na raiz do zip.
# -y preserva symlinks em vez de seguir/desreferenciar: o node_modules do
# build standalone do pnpm depende de symlinks (ex: node_modules/next ->
# .pnpm/next@.../node_modules/next) para resolver dependências irmãs como
# @swc/helpers. Sem -y o zip materializa cópias reais e quebra a resolução.
(cd "$PKG_DIR" && zip -rqy "$RELEASE_ZIP" .)
echo "==> Release criada em $RELEASE_ZIP"

echo "==> Enviando para ${REMOTE_HOST}:${REMOTE_DIR}"
ssh "$REMOTE_HOST" "mkdir -p ${REMOTE_DIR}"
scp "$RELEASE_ZIP" "${REMOTE_HOST}:${REMOTE_DIR}/"

echo
echo "Release pronta e enviada: ${REMOTE_DIR}/$(basename "$RELEASE_ZIP")"
echo "No servidor, rode: ./deploy-blog.sh $(basename "$RELEASE_ZIP")"
