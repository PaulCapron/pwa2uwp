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

%/: ; mkdir -p $@

dst/%: src/%; cp $< $@

dst/404.html: src/404.html; <$< tr -s " \n" >$@

dst/robots.txt: ; echo "Sitemap: $(ORIGIN)/sitemap.txt" >$@

dst/sitemap.txt: ; for p in / /tile-icons.html /appx-manifest.html /package.html; do echo "$(ORIGIN)$$p"; done >$@

dst/tile-icons.html dst/appx-manifest.html dst/package.html: dst/%.html: dst/%.js src/app.css

dst/%.html: src/%.html src/site.css postprod.xsl | 3p/saxon9he.jar 3p/htmlcompressor.jar 3p/yuicompressor.jar
	java -jar 3p/saxon9he.jar -s:$< -o:$@ -xsl:$(word 3,$^) basecssuri="file:$(CURDIR)/src/" basejsuri="file:$(CURDIR)/dst/" siteorigin="$(ORIGIN)"
	java -jar 3p/htmlcompressor.jar --compress-css --simple-bool-attr --simple-doctype --remove-surrounding-spaces html,meta,link,style,script,noscript -o $@ $@

dst/tile-icons.js dst/package.js: src/zip.js

dst/%.js: src/%.js src/app.js | 3p/closure-compiler.jar
	java -jar 3p/closure-compiler.jar --language_out ES5_STRICT --charset UTF-8 --rewrite_polyfills false --isolation_mode IIFE --dependency_mode STRICT --entry_point src/$* --js_output_file $@ $^


3p/yuicompressor.jar: | 3p/; $(HTTPGET) "https://github.com/yui/yuicompressor/releases/download/v2.4.8/yuicompressor-2.4.8.jar" >$@

3p/htmlcompressor.jar: | 3p/; $(HTTPGET) "https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/htmlcompressor/htmlcompressor-1.5.3.jar" >$@

3p/closure-compiler.jar: | 3p/; $(HTTPGET) "https://dl.google.com/closure-compiler/compiler-20181210.tar.gz" | tar -Oxzf - closure-compiler-v20181210.jar >$@

3p/saxon9he.jar: | 3p/
	$(HTTPGET) "https://downloads.sourceforge.net/project/saxon/Saxon-HE/9.9/SaxonHE9-9-1-1J.zip" >saxon.zip
	cd $(dir $@) && $(UNZIP) ../saxon.zip $(notdir $@)
	rm saxon.zip


stage: $(DST); cd dst && python3 -m http.server

deploy: $(DST); netlify deploy --prod --dir=dst

clean: ; rm -rf dst

cleanall: clean; rm -rf 3p
