// esbuild.config.js
const {build} = require('esbuild');
const {nodeExternalsPlugin} = require('esbuild-node-externals');
const {sassPlugin} = require('esbuild-sass-plugin');
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// 環境変数を取得（デフォルトは'development'）
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// 機能拡張：distディレクトリを動的指定可能にする
const DIST_DIR = process.env.BUILD_OUTPUT_DIR || './dist';

async function runBuild() {
    try {
        console.log(`Building for ${NODE_ENV} environment...`);

        // distディレクトリをクリーンアップ
        const distDir = path.resolve(DIST_DIR);
        if (fs.existsSync(distDir)) {
            console.log('Cleaning up dist directory...');
            fs.rmSync(distDir, {recursive: true, force: true});
        }
        fs.mkdirSync(distDir, {recursive: true});

        // Copy HTML file to dist directory
        fs.copyFileSync('./src/index.html', path.join(distDir, 'index.html'));

        // 1. Build main process
        await build({
            entryPoints: ['./src/main.ts'],
            outfile: path.join(distDir, 'main.js'),
            bundle: true,
            platform: 'node',
            target: 'node16',
            minify: isProd, // 本番環境のみminify
            external: [
                'electron',
                '@nestjs/websockets',
                '@nestjs/websockets/*',
                '@nestjs/microservices',
                '@nestjs/microservices/*',
                'class-validator',
                'class-transformer',
                '@nestjs/common',
                '@nestjs/core',
                '@nestjs/platform-express',
                'rxjs',
                'reflect-metadata'
            ],
            plugins: [nodeExternalsPlugin()],
            sourcemap: !isProd, // 開発環境のみソースマップを生成
            legalComments: 'none', // コメント除去を追加
            charset: 'utf8' // 文字コード指定
        });

        // 2. Build preload script
        await build({
            entryPoints: ['./src/preload.ts'],
            outfile: path.join(distDir, 'preload.js'),
            bundle: true,
            platform: 'node',
            target: 'node16',
            minify: isProd,
            external: ['electron'],
            plugins: [nodeExternalsPlugin()],
            sourcemap: !isProd,
            legalComments: 'none',
            charset: 'utf8'
        });

        // 3. Build styles
        await build({
            entryPoints: ['./src/styles/styles.scss'],
            outfile: path.join(distDir, 'styles.css'),
            bundle: true,
            minify: isProd,
            sourcemap: !isProd,
            plugins: [sassPlugin()],
            loader: {
                '.scss': 'css'
            }
        });

        // 4. Build renderer process
        await build({
            entryPoints: ['./src/renderer.ts'],
            outfile: path.join(distDir, 'renderer.js'),
            bundle: true,
            platform: 'browser',
            target: 'es2020',
            minify: isProd,
            sourcemap: !isProd,
            legalComments: 'none',
            charset: 'utf8'
        });

        let finalCode = fs.readFileSync(path.join(distDir, 'main.js'), 'utf8');

        // 2. 本番環境のみ難読化処理を適用
        if (isProd) {
            console.log('Applying obfuscation for production build...');
            finalCode = JavaScriptObfuscator.obfuscate(finalCode, {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.3,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.3,
                debugProtection: true,
                debugProtectionInterval: 1000,
                disableConsoleOutput: false,
                identifierNamesGenerator: 'hexadecimal',
                log: false,
                renameGlobals: false,
                rotateStringArray: true,
                selfDefending: true,
                stringArray: true,
                stringArrayEncoding: ['base64'],
                stringArrayThreshold: 0.3,
                unicodeEscapeSequence: false,
                reservedNames: ['^_defaultExport$'] // 名前保護
            }).getObfuscatedCode();
        }

        fs.writeFileSync(path.join(distDir, 'main.js'), finalCode);

        console.log(`Build completed successfully for ${NODE_ENV} environment! Build output: ${DIST_DIR}`);
    } catch (error) {
        console.error('Error during build:', error.message, error.stack);
        process.exit(1);
    }
}

runBuild();
