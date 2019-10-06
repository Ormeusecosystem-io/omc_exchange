<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Coti</title>
  <!-- Favicon -->
  <link rel="icon" href="favicon.png">
  <!--[if IE]><link rel="shortcut icon" href="favicon.ico"><![endif]-->
</head>

<body>
  <p>Redirecting...</p>
  <script src="js/config.js"></script>
  <script>
    var params = window.location.search;

    window.location = APConfig.interswitchRedirectURL + params;
  </script>
</body>

</html>