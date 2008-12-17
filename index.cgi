#!/usr/bin/perl
use strict;
use warnings;

use CGI;
use LivedoorReader::StorablePins;
use Template;
use YAML;

my $yaml = './config.yaml';
my $conf = YAML::LoadFile($yaml);

my $log = $conf->{log};
my $templatedir = './templates';
my $template = Template->new({INCLUDE_PATH => $templatedir});

my $cgi = new CGI(\*STDIN);

my $path_info = $cgi->path_info();
my ($null, $mode, $value, $command) = split /\//, $path_info;
unless ($mode) {
    $path_info =~ m|/(\w+)$|;
    $mode = $1 || 'all';
}

if ($mode eq 'api') {
    $mode = $command;
}

my %p =
    map {($_, $cgi->param($_))}
    grep /^(link|title|content)$/, $cgi->param;

my $pins = LivedoorReader::StorablePins->new(
    file => $log
);

if ($mode eq 'all') {
    print $cgi->header(
        -type => 'text/javascript; charset=utf-8'
    );
    print $pins->all;
    exit;
}
elsif ($mode eq 'add') {
    $pins->add(\%p);
}
elsif ($mode eq 'remove') {
    $pins->remove(\%p);
}
elsif ($mode eq 'clear') {
    $pins->clear;
}
else{
    if ($mode eq 'pinslist_list') {
        print $cgi->header(-type => 'text/html;charset=utf-8');
	$template->process("pinslist_list.tt", {pins => $pins});
    }
    elsif ($mode eq 'pinslist') {
        print $cgi->header(-type => 'text/html;charset=utf-8');
	my $file = $log . '/' . ($value || 'now');
        my $selected_pins = LivedoorReader::Pins->new(
            file => $file,
        );
        
        $template->process("pinslist.tt", {pins => $selected_pins});
    }
    elsif ($mode eq 'atom') {
        print $cgi->header(-type => 'text/xml;charset=utf-8'); 
	my $file = $log . '/' . ($value || 'now');
        my $selected_pins = LivedoorReader::Pins->new(
            file => $file,
        );
        
        $template->process("atom.tt", {pins => $selected_pins});
    }
    exit;
}

print $cgi->header(
    -type => 'text/javascript; charset=utf-8'
);
$pins->save;
print $pins->result;



