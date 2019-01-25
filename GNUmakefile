ORIGIN ?= https://pwa2uwp.fragara.com
HTTPGET ?= curl --fail --show-error --silent --location
UNZIP ?= $(shell command -v unzip || (command -v jar && echo xf))

.PHONY: build stage deploy clean cleanall
.DELETE_ON_ERROR:
.INTERMEDIATE: dst/tile-icons.js dst/appx-manifest.js dst/package.js

DST := dst/index.html \
	dst/tile-icons.html \
	dst/appx-manifest.html \
	dst/package.html \
	dst/404.html \
	dst/robots.txt \
	dst/sitemap.txt \
	dst/favicon.ico \
	dst/apple-touch-icon.png \
	dst/msft-partner-pkg.png

build: $(DST)
$(DST): | dst/
dst/: ; mkdir -p $@

dst/%: src/%; cp $< $@

dst/404.html: src/404.html; <$< tr -s " \n" >$@

dst/robots.txt: ; echo "Sitemap: $(ORIGIN)/sitemap.txt" >$@

dst/sitemap.txt: ; for p in / /tile-icons.html /appx-manifest.html /package.html; do echo "$(ORIGIN)$$p"; done >$@

dst/tile-icons.html dst/appx-manifest.html dst/package.html: dst/%.html: dst/%.js src/app.css

dst/%.html: src/%.html src/site.css aux/postprod.xsl | aux/saxon9he.jar aux/htmlcompressor.jar
	java -jar aux/saxon9he.jar -s:$< -o:$@ -xsl:$(word 3,$^) basecssuri="file:$(CURDIR)/src/" basejsuri="file:$(CURDIR)/dst/" siteorigin="$(ORIGIN)"
	java -jar aux/htmlcompressor.jar --compress-css --simple-bool-attr --simple-doctype --remove-surrounding-spaces html,meta,link,style,script,noscript -o $@ $@

dst/tile-icons.js dst/package.js: src/zip.js

dst/%.js: src/%.js src/app.js | aux/closure-compiler.jar
	java -jar aux/closure-compiler.jar --language_out ES5_STRICT --charset UTF-8 --rewrite_polyfills false --isolation_mode IIFE --dependency_mode STRICT --entry_point src/$* --js_output_file $@ $^


aux/yuicompressor.jar:
	$(HTTPGET) "https://github.com/yui/yuicompressor/releases/download/v2.4.8/yuicompressor-2.4.8.jar" >$@

aux/htmlcompressor.jar: | aux/yuicompressor.jar
	$(HTTPGET) "https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/htmlcompressor/htmlcompressor-1.5.3.jar" >$@

aux/closure-compiler.jar:
	$(HTTPGET) "https://dl.google.com/closure-compiler/compiler-20181210.tar.gz" | tar -Oxzf - closure-compiler-v20181210.jar >$@

aux/saxon9he.jar:
	$(HTTPGET) "https://downloads.sourceforge.net/project/saxon/Saxon-HE/9.9/SaxonHE9-9-1-1J.zip" >saxon.zip
	cd $(dir $@) && $(UNZIP) ../saxon.zip $(notdir $@)
	rm saxon.zip


stage: $(DST); cd dst && python3 -m http.server

deploy: $(DST); netlify deploy --prod --dir=dst

clean: ; rm -rf dst

cleanall: clean; rm -f aux/*.jar
