#!/usr/bin/env bash
set -euo pipefail

SITE_DIR="${SITE_DIR:-_site}"

echo "Preparing GitHub Pages artifact in ${SITE_DIR}/"
rm -rf "$SITE_DIR"
mkdir -p "$SITE_DIR"

rsync -a ./ "$SITE_DIR"/ \
  --exclude ".git" \
  --exclude ".github" \
  --exclude "node_modules" \
  --exclude "$SITE_DIR" \
  --exclude ".DS_Store"

# GitHub Pages should serve folders like _next/ exactly as committed/built.
touch "$SITE_DIR/.nojekyll"

has_build_script() {
  node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts.build ? 0 : 1)"
}

package_mentions() {
  local needle="$1"
  node -e "const p=require('./package.json'); const all={...(p.dependencies||{}), ...(p.devDependencies||{})}; process.exit(all['$needle'] || JSON.stringify(p).includes('$needle') ? 0 : 1)"
}

copy_build_output() {
  local build_dir="$1"

  if [ ! -d "$build_dir" ]; then
    echo "ERROR: expected build output '${build_dir}' was not created."
    ls -la
    return 1
  fi

  echo "Publishing ${PWD}/${build_dir}/ into the code_deliverable root"
  find . -mindepth 1 -maxdepth 1 \
    ! -name "$build_dir" \
    ! -name "node_modules" \
    -exec rm -rf {} +
  cp -R "$build_dir"/. .
  rm -rf "$build_dir" node_modules
}

process_directory() {
  local folder="$1"
  echo "Processing $folder"

  if [ ! -f "$folder/package.json" ]; then
    echo "Static site detected; no build needed."
    return
  fi

  pushd "$folder" >/dev/null

  if ! has_build_script; then
    echo "package.json has no build script; leaving files as static content."
    popd >/dev/null
    return
  fi

  if [ -f "package-lock.json" ]; then
    npm ci --legacy-peer-deps
  else
    npm install --legacy-peer-deps
  fi

  if package_mentions "vite"; then
    echo "Building Vite app with relative asset paths."
    npm run build -- --base=./
  elif package_mentions "react-scripts"; then
    echo "Building Create React App with relative asset paths."
    PUBLIC_URL=. npm run build
  else
    echo "Building app with its package.json build script."
    npm run build
  fi

  if [ -d "dist" ]; then
    copy_build_output "dist"
  elif [ -d "build" ]; then
    copy_build_output "build"
  elif [ -d "out" ]; then
    copy_build_output "out"
  else
    echo "ERROR: build finished but no dist/, build/, or out/ folder was found."
    ls -la
    exit 1
  fi

  popd >/dev/null
}

echo "=== Building code_deliverable apps ==="
while IFS= read -r -d '' folder; do
  process_directory "$folder"
done < <(find "$SITE_DIR" -type d -path '*/code_deliverable' -print0)

echo "=== Generating activities manifest ==="
pushd "$SITE_DIR" >/dev/null
python3 scripts/generate_manifest.py || echo "Manifest generation skipped (non-fatal)."
popd >/dev/null

echo "Pages artifact ready: $SITE_DIR/"
