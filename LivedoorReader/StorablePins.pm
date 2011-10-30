package LivedoorReader::StorablePins;
use strict;
use warnings;

use File::Slurp;
use LivedoorReader::Pins;

use base qw( Class::Accessor::Fast );
__PACKAGE__->mk_accessors(qw/pins dir file_list/);

sub new {
    my $pkg = shift;
    my %opt = @_;

    my $dir = $opt{file};
    die unless ($dir);
    mkdir $dir, 0777 unless (-e $dir);

    my $current_file = $dir.'/now';
    warn $current_file;
    my $current_pins = LivedoorReader::Pins->new(
        file => $current_file,
    );

    my @pins_list;
    if (@pins_list = read_dir($dir)) {
        chomp @pins_list;

        @pins_list =
            #map {$dir.'/'.$_}
            grep /^\d+$/, @pins_list;
        unshift @pins_list, 'now';
    }

    my $self = {
        dir => $dir,
        file_list => \@pins_list,
        pins => $current_pins,
    };

    bless $self, $pkg;
}

sub add {
    my ($self, $pin) = @_;

    return $self->pins->add($pin);
}

sub remove {
    my ($self, $pin) = @_;

    return $self->pins->remove($pin);
}

sub all {
    my $self = shift;

    return $self->pins->all;
}

sub result {
    my $self = shift;

    return $self->pins->result;
}

sub save {
    my $self = shift;

    if ($self->pins) {
        $self->pins->save;
    }
}

sub clear {
    my $self = shift;

    $self->create_pins;
}

sub create_pins {
    my $self = shift;
    my $dir = $self->dir;

    my $path = $dir.'/'.time;
    splice @{$self->{file_list}}, 1, 0, $path;

    $self->pins->save_as($path);
    $self->pins->clear;
}

1;
