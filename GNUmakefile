ORIGIN ?= https://pwa2uwp.fragara.com

.DELETE_ON_ERROR:

dst: dst/index.html \
	dst/tile-icons.html \
	dst/appx-manifest.html \
	dst/package.html \
	dst/404.html \
	dst/robots.txt \
	dst/favicon.ico \
	dst/apple-touch-icon.png

dst/robots.txt: ; touch $@

dst/%: src/%; cp $< $@

dst/404.html: src/404.html
	java -jar aux/htmlcompressor*.jar --compress-css --remove-quotes --remove-intertag-spaces -o $@ $<

dst/tile-icons.html dst/appx-manifest.html dst/package.html: dst/%.html: dst/%.js src/app.css

dst/%.html: src/%.html src/site.css aux/postprod.xsl
	@mkdir -p $(dir $@)
	java -jar aux/saxon9he.jar -o:$@ -s:$< -xsl:$(word 3,$^) basecssuri="file:$(CURDIR)/src/" basejsuri="file:$(CURDIR)/dst/" siteorigin="$(ORIGIN)"
	java -jar aux/htmlcompressor*.jar --compress-css --simple-bool-attr --simple-doctype --remove-surrounding-spaces html,meta,link,style,script,noscript -o $@ $@

.INTERMEDIATE: dst/tile-icons.js dst/appx-manifest.js dst/package.js

dst/tile-icons.js dst/package.js: src/zip.js

dst/%.js: src/%.js src/app.js
	@mkdir -p $(dir $@)
	java -jar aux/closure-compiler*.jar --language_out ES5_STRICT --charset UTF-8 --rewrite_polyfills false --isolation_mode IIFE --dependency_mode STRICT --entry_point src/$* --js_output_file $@ $^


.PHONY: clean deps stage deploy

clean: ; rm -rf dst

deps: ; cd aux && ./grab-3p-deps.sh

stage: dst; cd $< && python3 -m http.server

deploy: dst; netlify deploy --prod --dir=$<
