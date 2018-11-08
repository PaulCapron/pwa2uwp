<!--
    postprod.xsl: “Post-production” transformations to an HTML page to make it
    more suitable for service over the Internet.

    ⚠ Elements, attribute names, and values that are case-insensitive in HTML
    are expected to always be in _lowercase_ in the source document.
-->
<stylesheet version="2.0" xmlns="http://www.w3.org/1999/XSL/Transform">
  <output method="html" html-version="5" encoding="utf-8" indent="no"/>

  <!-- Embed local CSS files. -->
  <param name="basecssuri"/>
  <template match="link[@rel='stylesheet'][not(matches(@href, '^\s*[a-z\-]+:'))]">
    <element name="style" namespace="">
      <value-of select="unparsed-text(resolve-uri(@href, $basecssuri), 'utf-8')"/>
    </element>
  </template>

  <!-- Embed local JS files. -->
  <param name="basejsuri"/>
  <template match="script[@src][not(matches(@src, '^\s*[a-z\-]+:'))]">
    <element name="script" namespace="">
      <value-of select="unparsed-text(resolve-uri(@src, $basejsuri), 'utf-8')"/>
    </element>
  </template>

  <!-- Canonicalize the URL of homepage links. -->
  <template match="@href[. = 'index.html']">
    <attribute name="href">
      <value-of select="'/'"/>
    </attribute>
  </template>

  <!-- Identity transform (verbatim-copy things not matched by previous templates). -->
  <template match="node() | @*">
    <copy>
      <apply-templates select="node() | @*"/>
    </copy>
  </template>
</stylesheet>
