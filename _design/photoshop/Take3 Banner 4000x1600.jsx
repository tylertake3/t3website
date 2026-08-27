/*
  Take 3 — wide banner template
  ------------------------------------------------------------------
  Creates the letterbox banner document used by the site's full-bleed
  page covers, with the safe-area guides already in place.

    Canvas            4000 x 1600 px, 72 ppi, RGB, 8-bit, transparent
    Vertical guides   2040 px and 3200 px  — the dancer must stay between them
    Horizontal guides 130 px and 1490 px   — top of the figure / bottom of the figure

  Install: put this file in Photoshop's Presets/Scripts folder, restart
  Photoshop, then it appears under File > Scripts. Or run it any time with
  File > Scripts > Browse.

  Then: File > Place Embedded, scale the photo so the figure spans the two
  horizontal guides, position it between the vertical guides with the empty
  backdrop on the left, and Generative Fill the empty areas with an EMPTY
  prompt.
*/

#target photoshop

(function () {
  var WIDTH = 4000;
  var HEIGHT = 1600;
  var RESOLUTION = 72;
  var VERTICAL_GUIDES = [2040, 3200];
  var HORIZONTAL_GUIDES = [130, 1490];

  /* guides are placed in whatever the ruler is currently set to, so pin it to
     pixels for the duration and hand the user's own setting back afterwards */
  var previousUnits = app.preferences.rulerUnits;
  app.preferences.rulerUnits = Units.PIXELS;

  try {
    var doc = app.documents.add(
      UnitValue(WIDTH, 'px'),
      UnitValue(HEIGHT, 'px'),
      RESOLUTION,
      'banner-wide',
      NewDocumentMode.RGB,
      DocumentFill.TRANSPARENT,
      1,
      BitsPerChannelType.EIGHT
    );

    var i;
    for (i = 0; i < VERTICAL_GUIDES.length; i++) {
      doc.guides.add(Direction.VERTICAL, UnitValue(VERTICAL_GUIDES[i], 'px'));
    }
    for (i = 0; i < HORIZONTAL_GUIDES.length; i++) {
      doc.guides.add(Direction.HORIZONTAL, UnitValue(HORIZONTAL_GUIDES[i], 'px'));
    }
  } catch (e) {
    alert('Could not create the banner document:\n' + e);
  } finally {
    app.preferences.rulerUnits = previousUnits;
  }
})();
