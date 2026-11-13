<?php
/* CNS Launch Atlas: personal-link gate.
   Each person gets their own link:  https://<your subdomain>/?k=THEIR-CODE
   Codes and names live in access/people.csv. A code works only when its row has a name and active = yes.
   Every visit is written to access/log.csv. The row with role "admin" can open  /?view=log  to see who has used it.
   No form, no email, no password. Nothing is served without a valid code. */

header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Cache-Control: private, no-store');
header('Referrer-Policy: no-referrer');

$DIR = __DIR__;
$PEOPLE = $DIR . '/access/people.csv';
$LOG = $DIR . '/access/log.csv';
$APP = $DIR . '/app/atlas.html';
$COOKIE = 'atlas_k';

function people($file) {
    $out = array();
    if (!is_readable($file)) return $out;
    $h = fopen($file, 'r');
    $first = true;
    while (($r = fgetcsv($h, 0, ',', '"', '\\')) !== false) {
        if ($first) { $first = false; continue; }                       // header row
        if (count($r) < 2) continue;
        $code = trim(preg_replace('/^\xEF\xBB\xBF/', '', (string)$r[0]));
        $name = trim((string)$r[1]);
        $role = isset($r[2]) ? strtolower(trim((string)$r[2])) : '';
        $active = isset($r[3]) ? strtolower(trim((string)$r[3])) : 'yes';
        if ($code === '' || $name === '' || $active !== 'yes') continue; // unassigned or switched off
        $out[$code] = array('name' => $name, 'role' => $role);
    }
    fclose($h);
    return $out;
}
function find_person($all, $code) {
    $code = trim((string)$code);
    if ($code === '' || strlen($code) > 80) return null;
    foreach ($all as $c => $p) { if (hash_equals((string)$c, $code)) return $p; }
    return null;
}
function log_event($file, $name, $event) {
    $ua = isset($_SERVER['HTTP_USER_AGENT']) ? substr(preg_replace('/[\r\n,]+/', ' ', $_SERVER['HTTP_USER_AGENT']), 0, 160) : '';
    $new = !file_exists($file);
    $h = @fopen($file, 'a');
    if (!$h) return;
    if (flock($h, LOCK_EX)) {
        if ($new) fputcsv($h, array('time_utc', 'name', 'event', 'browser'), ',', '"', '\\');
        fputcsv($h, array(gmdate('Y-m-d H:i:s'), $name, $event, $ua), ',', '"', '\\');
        flock($h, LOCK_UN);
    }
    fclose($h);
}
function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function page($title, $body) {
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>' . e($title) . '</title>'
       . '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@600;700&family=Inter:wght@400;500;600&display=swap">'
       . '<style>body{margin:0;background:#F8FAFC;color:#111827;font:17px/1.5 Inter,Arial,sans-serif}main{max-width:760px;margin:0 auto;padding:12vh 24px 48px}h1{font-family:"Instrument Sans",Inter,Arial,sans-serif;font-weight:700;font-size:44px;line-height:1.05;letter-spacing:-.015em;margin:0 0 16px}'
       . '.rule{width:96px;height:6px;border-radius:3px;background:#2457D6;margin-bottom:24px}p{margin:0 0 14px;color:#42526E}b{color:#111827}small{display:block;margin-top:40px;font-size:14px;color:#42526E}'
       . 'table{border-collapse:collapse;width:100%;font-size:15px;margin-top:16px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid rgba(17,24,39,.12)}th{font-size:14px;color:#42526E;font-weight:600}td.n{text-align:right}a{color:#2457D6}</style></head><body><main>'
       . $body . '</main></body></html>';
}

$all = people($PEOPLE);
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

if (isset($_GET['bye'])) {                                              // sign out
    setcookie($COOKIE, '', time() - 3600, '/', '', $https, true);
    page('Signed out', '<div class="rule"></div><h1>Signed out.</h1><p>Use your personal link to come back.</p>');
    exit;
}

if (isset($_GET['k'])) {                                                // arriving with a personal link
    $p = find_person($all, $_GET['k']);
    if ($p) {
        setcookie($COOKIE, trim((string)$_GET['k']), array('expires' => time() + 90 * 86400, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax'));
        log_event($LOG, $p['name'], 'link opened');
        header('Location: ./', true, 302);                              // keep the code out of the address bar
        exit;
    }
    log_event($LOG, '(unknown)', 'link refused');
}

$p = isset($_COOKIE[$COOKIE]) ? find_person($all, $_COOKIE[$COOKIE]) : null;

if (!$p) {
    http_response_code(403);
    page('CNS Launch Atlas', '<div class="rule"></div><h1>This one is by invitation.</h1><p>The CNS Launch Atlas is not public. It is shared with a small group of colleagues, each with a personal link.</p><p><b>If you have a link,</b> open it again; it may have been cut off.</p><p><b>If you would like one,</b> message Frankie on LinkedIn.</p><small>For education and planning only. Not investment, medical, legal or regulatory advice.</small>');
    exit;
}

if (isset($_GET['view']) && $_GET['view'] === 'log') {                  // usage view, admin row only
    if ($p['role'] !== 'admin') { http_response_code(403); page('Not available', '<div class="rule"></div><h1>Not available.</h1>'); exit; }
    $by = array(); $recent = array();
    if (is_readable($LOG)) {
        $h = fopen($LOG, 'r'); $first = true;
        while (($r = fgetcsv($h, 0, ',', '"', '\\')) !== false) {
            if ($first) { $first = false; continue; }
            if (count($r) < 3) continue;
            $recent[] = $r;
            if ($r[2] !== 'visit' && $r[2] !== 'link opened') continue;
            if (!isset($by[$r[1]])) $by[$r[1]] = array('n' => 0, 'first' => $r[0], 'last' => $r[0]);
            $by[$r[1]]['n']++; $by[$r[1]]['last'] = $r[0];
        }
        fclose($h);
    }
    uasort($by, function ($a, $b) { return strcmp($b['last'], $a['last']); });
    $rows = '';
    foreach ($by as $n => $v) $rows .= '<tr><td>' . e($n) . '</td><td class="n">' . $v['n'] . '</td><td>' . e($v['first']) . '</td><td>' . e($v['last']) . '</td></tr>';
    $never = array();
    foreach ($all as $c => $q) if (!isset($by[$q['name']])) $never[] = e($q['name']);
    $tail = '';
    foreach (array_slice(array_reverse($recent), 0, 40) as $r) $tail .= '<tr><td>' . e($r[0]) . '</td><td>' . e($r[1]) . '</td><td>' . e($r[2]) . '</td></tr>';
    page('Atlas usage', '<div class="rule"></div><h1>Who has used it</h1><p>' . count($by) . ' of ' . count($all) . ' people with a live link have opened it. Times are UTC.</p>'
        . '<table><tr><th>Name</th><th style="text-align:right">Visits</th><th>First</th><th>Last</th></tr>' . ($rows ?: '<tr><td colspan="4">No visits yet.</td></tr>') . '</table>'
        . ($never ? '<p style="margin-top:24px"><b>Not opened yet:</b> ' . implode(', ', $never) . '</p>' : '')
        . '<h1 style="font-size:26px;margin-top:40px">Last 40 events</h1><table><tr><th>Time</th><th>Name</th><th>Event</th></tr>' . $tail . '</table><p style="margin-top:24px"><a href="./">Open the atlas</a></p>');
    exit;
}

if (!is_readable($APP)) { http_response_code(500); page('Not ready', '<div class="rule"></div><h1>Almost there.</h1><p>The app file is missing from the app folder.</p>'); exit; }
log_event($LOG, $p['name'], 'visit');
$html = file_get_contents($APP);
$html = str_replace('Not affiliated with or endorsed by any company named.</div>', 'Not affiliated with or endorsed by any company named. Access to this copy is logged by name; please do not redistribute.</div>', $html);
header('Content-Type: text/html; charset=utf-8');
echo $html;
